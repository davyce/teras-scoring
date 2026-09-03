# backend/scoring/views_bank_documents.py
"""
TERAS Bank Documents — Gestion documentaire côté banque
La banque peut :
  - Uploader des documents pour/sur ses clients (contrats, analyses crédit)
  - Voir les documents soumis par ses clients
  - Analyser les documents avec l'IA (analyse risque crédit)
  - Exporter des rapports documentaires

Endpoints :
  POST /bank/documents/upload/                  Upload document banque
  GET  /bank/documents/list/                    Liste tous les docs banque
  GET  /bank/documents/<id>/                    Détail document
  DELETE /bank/documents/<id>/delete/           Supprimer
  GET  /bank/documents/<id>/download/           Télécharger
  POST /bank/documents/<id>/analyze-credit/     Analyse risque crédit IA
  GET  /bank/clients/<client_id>/documents/     Docs d'un client spécifique
"""

import os
import json
import threading
import logging
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .document_parser import parse_document, detect_format
from .models import UserDocument
from .models_bank import BankClient
from .views_bank_notifications import _send_system_message
from .views_bank_part1 import _scope_by_bank_owner

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    'pdf', 'xlsx', 'xls', 'csv', 'ofx', 'qif', 'sta',
    'jpg', 'jpeg', 'png', 'docx', 'doc',
}
MAX_UPLOAD_BYTES = 20 * 1024 * 1024   # 20 MB pour la banque
SYNC_MAX_BYTES   = 2 * 1024 * 1024    # 2 MB sync

PARSE_EXPECTED_DOC_TYPES = {
    'client_statement',
}


def _finalize_parse_status(result: dict, *, parse_expected: bool) -> dict:
    errors = [str(err).strip() for err in result.get('errors', []) if str(err).strip()]
    parsing_success = bool(result.get('parsing_success'))

    if parsing_success:
        status_value = 'parsed'
        display_status = 'analyzed'
        message = 'Document client enregistré et analysé.'
    elif errors and parse_expected:
        status_value = 'failed'
        display_status = 'failed'
        message = 'Document enregistré, mais l’analyse structurée a échoué.'
    else:
        status_value = 'uploaded'
        display_status = 'stored'
        message = 'Document enregistré. Analyse structurée non applicable ou aucune donnée exploitable détectée.'

    result['status'] = status_value
    result['display_status'] = display_status
    result['parse_expected'] = parse_expected
    result['message'] = message
    return result


def _get_bank_doc_dir(bank_user_id: int, client_id: int = None) -> str:
    base = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'bank_documents',
        str(bank_user_id),
        str(client_id) if client_id else '_general'
    )
    os.makedirs(base, exist_ok=True)
    return base


def _get_result_path(doc_path: str) -> str:
    return doc_path + '.result.json'


def _save_result(doc_path: str, result: dict):
    try:
        with open(_get_result_path(doc_path), 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2, default=str)
    except Exception as e:
        logger.error(f"Save result error: {e}")


def _load_result(doc_path: str) -> dict:
    try:
        rp = _get_result_path(doc_path)
        if os.path.exists(rp):
            with open(rp, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _list_bank_docs(bank_user_id: int, client_id: int = None) -> list:
    docs = []
    base_dir = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'bank_documents',
        str(bank_user_id)
    )
    if not os.path.exists(base_dir):
        return docs

    # Parcourir tous les sous-dossiers (clients + _general)
    scan_dirs = []
    if client_id:
        client_dir = os.path.join(base_dir, str(client_id))
        if os.path.exists(client_dir):
            scan_dirs = [(client_dir, client_id)]
    else:
        for sub in os.listdir(base_dir):
            sub_path = os.path.join(base_dir, sub)
            if os.path.isdir(sub_path):
                cid = None if sub == '_general' else sub
                scan_dirs.append((sub_path, cid))

    for (ddir, cid) in scan_dirs:
        try:
            for fname in os.listdir(ddir):
                if fname.endswith('.result.json'):
                    continue
                ext = Path(fname).suffix.lower().lstrip('.')
                if ext not in ALLOWED_EXTENSIONS:
                    continue
                fpath  = os.path.join(ddir, fname)
                stat   = os.stat(fpath)
                result = _load_result(fpath)
                doc_type = result.get('doc_type', 'general')
                if result.get('status') != 'processing':
                    result = _finalize_parse_status(
                        result,
                        parse_expected=doc_type in PARSE_EXPECTED_DOC_TYPES,
                    )
                docs.append({
                    'id':                fname,
                    'filename':          fname,
                    'client_id':         cid,
                    'size_bytes':        stat.st_size,
                    'size_mb':           round(stat.st_size / (1024 * 1024), 2),
                    'format':            result.get('format', detect_format(fpath, fname)),
                    'uploaded_at':       datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    'doc_type':          doc_type,
                    'status':            result.get('status', 'uploaded'),
                    'display_status':    result.get('display_status', result.get('status', 'uploaded')),
                    'parse_expected':    result.get(
                        'parse_expected',
                        result.get('doc_type', 'general') in PARSE_EXPECTED_DOC_TYPES,
                    ),
                    'transactions_count':len(result.get('transactions', [])),
                    'authenticity_score':result.get('quality', {}).get('authenticity_score', 0),
                    'crm_estimated':     result.get('teras_signals', {}).get('crm_estimated_xaf', 0),
                    'months_covered':    result.get('quality', {}).get('stats', {}).get('months_covered', 0),
                    'message':           result.get('message', ''),
                })
        except Exception as e:
            logger.error(f"Error listing bank docs in {ddir}: {e}")

    docs.sort(key=lambda d: d['uploaded_at'], reverse=True)
    return docs


def _serialize_client_owned_document(doc: UserDocument) -> dict:
    analysis = doc.ai_analysis or {}
    extracted = doc.extracted_data or {}
    bank_review = analysis.get('bank_review') or {}
    review_status = bank_review.get('status') or 'pending'
    review_labels = {
        'pending': 'À vérifier',
        'approved': 'Validé banque',
        'rejected': 'Rejeté banque',
    }
    return {
        'id': f'user-{doc.id}',
        'document_id': doc.id,
        'source': 'client',
        'filename': doc.filename,
        'category': doc.category,
        'category_label': getattr(doc, 'get_category_display', lambda: doc.category)(),
        'mime_type': doc.mime_type,
        'size_bytes': doc.file_size,
        'size_mb': round((doc.file_size or 0) / (1024 * 1024), 2),
        'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        'processed_at': doc.processed_at.isoformat() if doc.processed_at else None,
        'status': doc.status,
        'display_status': doc.get_status_display(),
        'confidence': round(float(doc.confidence or 0) * 100, 1),
        'is_analyzed': doc.is_analyzed,
        'bank_review': {
            'status': review_status,
            'status_label': review_labels.get(review_status, review_status),
            'notes': bank_review.get('notes', ''),
            'reviewed_at': bank_review.get('reviewed_at'),
            'reviewed_by': bank_review.get('reviewed_by'),
        },
        'summary': {
            'transactions_count': len(extracted.get('transactions', []) or []),
            'recommendations_count': len(analysis.get('recommendations', []) or []),
            'score_impact': doc.get_score_impact().get('estimated_change', 0),
        },
    }


def _get_scoped_client_owned_document(user, document_id):
    try:
        document = UserDocument.objects.select_related('user').get(id=document_id)
    except UserDocument.DoesNotExist:
        return None, None

    client = _scope_by_bank_owner(
        BankClient.objects.select_related('user'),
        user,
    ).filter(user_id=document.user_id).first()
    return document, client


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def bank_upload_document(request):
    """POST /bank/documents/upload/"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'Aucun fichier.'}, status=400)

    filename = file.name
    ext      = Path(filename).suffix.lower().lstrip('.')
    if ext not in ALLOWED_EXTENSIONS:
        return Response({'error': f"Extension '{ext}' non supportée."}, status=400)
    if file.size > MAX_UPLOAD_BYTES:
        return Response({'error': f"Fichier trop volumineux (max 20 MB)."}, status=400)

    client_id = request.data.get('client_id')
    doc_type  = request.data.get('doc_type', 'bank_document')
    notes     = request.data.get('notes', '')

    doc_dir   = _get_bank_doc_dir(request.user.id, client_id)
    ts        = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_name = f"{ts}_{filename.replace(' ', '_')}"
    file_path = os.path.join(doc_dir, safe_name)
    parse_expected = doc_type in PARSE_EXPECTED_DOC_TYPES

    with open(file_path, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)

    mime_type = file.content_type or ''

    if file.size <= SYNC_MAX_BYTES:
        try:
            result = parse_document(file_path, filename, mime_type)
        except Exception as exc:
            result = {
                'errors': [str(exc)],
                'parsing_success': False,
                'transactions': [],
                'quality': {},
                'teras_signals': {},
                'recommendations': [],
                'format': detect_format(file_path, filename, mime_type),
            }
        result['doc_type']  = doc_type
        result['notes']     = notes
        result['client_id'] = client_id
        result = _finalize_parse_status(result, parse_expected=parse_expected)
        _save_result(file_path, result)

        return Response({
            'status':             result['status'],
            'filename':           safe_name,
            'format':             result['format'],
            'transactions_count': len(result['transactions']),
            'authenticity_score': result['quality'].get('authenticity_score', 0),
            'teras_signals':      result['teras_signals'],
            'recommendations':    result['recommendations'],
            'errors':             result['errors'],
            'message':            result['message'],
            'display_status':     result['display_status'],
            'parse_expected':     result['parse_expected'],
        })
    else:
        _save_result(file_path, {
            'status': 'processing',
            'display_status': 'processing',
            'doc_type': doc_type,
            'client_id': client_id,
            'parse_expected': parse_expected,
            'message': 'Document enregistré. Analyse en arrière-plan en cours.',
        })

        def _async():
            try:
                result = parse_document(file_path, filename, mime_type)
                result['doc_type']  = doc_type
                result['notes']     = notes
                result['client_id'] = client_id
                result = _finalize_parse_status(result, parse_expected=parse_expected)
                _save_result(file_path, result)
            except Exception as exc:
                _save_result(file_path, {
                    'status': 'failed',
                    'display_status': 'failed',
                    'doc_type': doc_type,
                    'client_id': client_id,
                    'parse_expected': parse_expected,
                    'errors': [str(exc)],
                    'message': 'Document enregistré, mais l’analyse structurée a échoué.',
                })

        threading.Thread(target=_async, daemon=True).start()
        return Response({
            'status': 'processing',
            'filename': safe_name,
            'message': 'Document enregistré. Analyse en arrière-plan en cours.',
            'display_status': 'processing',
            'parse_expected': parse_expected,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_list_documents(request):
    """GET /bank/documents/list/?client_id=X"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    client_id = request.GET.get('client_id')
    docs = _list_bank_docs(request.user.id, client_id)

    return Response({
        'documents': docs,
        'count':     len(docs),
        'summary': {
            'parsed':     sum(1 for d in docs if d['status'] == 'parsed'),
            'processing': sum(1 for d in docs if d['status'] == 'processing'),
            'uploaded':   sum(1 for d in docs if d['status'] == 'uploaded'),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_document_detail(request, doc_id):
    """GET /bank/documents/<doc_id>/"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    # Chercher dans tous les sous-dossiers
    base_dir = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'bank_documents', str(request.user.id)
    )
    file_path = None
    for root, dirs, files in os.walk(base_dir):
        if doc_id in files:
            file_path = os.path.join(root, doc_id)
            break

    if not file_path or not os.path.exists(file_path):
        return Response({'error': 'Document non trouvé.'}, status=404)

    result = _load_result(file_path)
    doc_type = result.get('doc_type', 'bank_document')
    if result.get('status') != 'processing':
        result = _finalize_parse_status(
            result,
            parse_expected=doc_type in PARSE_EXPECTED_DOC_TYPES,
        )
    stat   = os.stat(file_path)
    include_txns = request.GET.get('include_transactions', '0') == '1'

    response_data = {
        'id':                 doc_id,
        'filename':           doc_id,
        'size_mb':            round(stat.st_size / (1024 * 1024), 2),
        'format':             result.get('format', 'unknown'),
        'status':             result.get('status', 'uploaded'),
        'display_status':     result.get('display_status', result.get('status', 'uploaded')),
        'parse_expected':     result.get(
            'parse_expected',
            result.get('doc_type', 'bank_document') in PARSE_EXPECTED_DOC_TYPES,
        ),
        'doc_type':           doc_type,
        'client_id':          result.get('client_id'),
        'uploaded_at':        datetime.fromtimestamp(stat.st_ctime).isoformat(),
        'transactions_count': len(result.get('transactions', [])),
        'quality':            result.get('quality', {}),
        'teras_signals':      result.get('teras_signals', {}),
        'recommendations':    result.get('recommendations', []),
        'errors':             result.get('errors', []),
        'message':            result.get('message', ''),
    }
    if include_txns:
        response_data['transactions'] = result.get('transactions', [])[:100]

    return Response(response_data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def bank_delete_document(request, doc_id):
    """DELETE /bank/documents/<doc_id>/delete/"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    base_dir = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'bank_documents', str(request.user.id)
    )
    for root, dirs, files in os.walk(base_dir):
        if doc_id in files:
            file_path = os.path.join(root, doc_id)
            os.remove(file_path)
            rp = _get_result_path(file_path)
            if os.path.exists(rp):
                os.remove(rp)
            return Response({'message': 'Document supprimé.'})

    return Response({'error': 'Document non trouvé.'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_download_document(request, doc_id):
    """GET /bank/documents/<doc_id>/download/"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    base_dir = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'bank_documents', str(request.user.id)
    )
    for root, dirs, files in os.walk(base_dir):
        if doc_id in files:
            return FileResponse(
                open(os.path.join(root, doc_id), 'rb'),
                as_attachment=True, filename=doc_id
            )

    return Response({'error': 'Document non trouvé.'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bank_analyze_credit(request, doc_id):
    """POST /bank/documents/<doc_id>/analyze-credit/ — Analyse risque crédit IA"""
    import requests as req

    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    base_dir = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'bank_documents', str(request.user.id)
    )
    result = None
    for root, dirs, files in os.walk(base_dir):
        if doc_id in files:
            result = _load_result(os.path.join(root, doc_id))
            break

    if not result:
        return Response({'error': 'Document non trouvé.'}, status=404)

    signals = result.get('teras_signals', {})
    quality = result.get('quality', {})
    stats   = quality.get('stats', {})

    prompt = f"""Tu es analyste crédit TERAS pour une banque en Afrique Centrale.
Analyse ce document financier d'un client et fournis une évaluation risque crédit complète.

DONNÉES PARSÉES :
- Transactions analysées : {stats.get('total_transactions', 0)}
- Période : {stats.get('months_covered', 0)} mois ({stats.get('date_from')} → {stats.get('date_to')})
- Score authenticité document : {quality.get('authenticity_score', 0) * 100:.0f}%
- Total crédits (entrées) : {stats.get('total_credits_xaf', 0):,.0f} FCFA
- Total débits (sorties) : {stats.get('total_debits_xaf', 0):,.0f} FCFA
- Cashflow net mensuel : {stats.get('net_cashflow_xaf', 0) / max(stats.get('months_covered', 1), 1):,.0f} FCFA/mois
- Revenu mensuel moyen estimé : {signals.get('income_signal', {}).get('monthly_avg_xaf', 0):,.0f} FCFA
- CRM (Capacité Remboursement Mensuelle) : {signals.get('crm_estimated_xaf', 0):,.0f} FCFA
- Stabilité revenus : {signals.get('income_signal', {}).get('income_stability', 0) * 100:.0f}%
- Transactions tontine : {signals.get('tontine_transactions', 0)}
- Anomalies détectées : {len(quality.get('anomalies', []))}

INSTRUCTIONS :
1. **Évaluation risque global** : Faible / Modéré / Élevé + justification
2. **Analyse cashflow** : Régularité, saisonnalité, points forts/faibles
3. **Capacité d'endettement** : Montant max recommandé (basé CRM), durée optimale, taux suggéré
4. **Alertes bancaires** : Anomalies, incohérences, risques spécifiques
5. **Décision recommandée** : Approuver / Conditionnel / Refuser + conditions
6. **Bande TERAS estimée** : A/B/C/D/E avec score approximatif

Format professionnel avec sections ## et bullet points.
"""

    try:
        anthropic_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
        if not anthropic_key:
            return Response({'error': 'Clé API Anthropic non configurée.'}, status=503)

        response = req.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key":         anthropic_key,
                "content-type":      "application/json",
                "anthropic-version": "2023-06-01",
            },
            json={
                "model":    "claude-sonnet-4-20250514",
                "max_tokens": 1500,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        response.raise_for_status()
        analysis = response.json()['content'][0]['text']

        return Response({
            'analysis':     analysis,
            'risk_signals': {
                'crm':              signals.get('crm_estimated_xaf', 0),
                'income_stability': signals.get('income_signal', {}).get('income_stability', 0),
                'cashflow_net':     stats.get('net_cashflow_xaf', 0),
                'anomalies':        len(quality.get('anomalies', [])),
                'authenticity':     quality.get('authenticity_score', 0),
            },
            'analyzed_at': datetime.now().isoformat(),
        })

    except Exception as e:
        return Response({'error': f"Erreur IA : {e}"}, status=503)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_client_documents(request, client_id):
    """GET /bank/clients/<client_id>/documents/ — Documents d'un client"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    client = _scope_by_bank_owner(
        BankClient.objects.select_related('user'),
        request.user,
    ).filter(id=client_id).first()
    if not client:
        return Response({'error': 'Client introuvable.'}, status=404)

    client_docs = []
    if client.user_id:
        client_docs = [
            _serialize_client_owned_document(doc)
            for doc in UserDocument.objects.filter(user_id=client.user_id).order_by('-uploaded_at')
        ]

    bank_docs = _list_bank_docs(request.user.id, client_id)
    documents = client_docs + bank_docs
    documents.sort(
        key=lambda item: item.get('uploaded_at') or '',
        reverse=True,
    )

    return Response({
        'documents': documents,
        'client_documents': client_docs,
        'bank_documents': bank_docs,
        'summary': {
            'client_documents': len(client_docs),
            'bank_documents': len(bank_docs),
            'pending_review': sum(
                1 for doc in client_docs if (doc.get('bank_review') or {}).get('status') == 'pending'
            ),
            'approved_review': sum(
                1 for doc in client_docs if (doc.get('bank_review') or {}).get('status') == 'approved'
            ),
            'rejected_review': sum(
                1 for doc in client_docs if (doc.get('bank_review') or {}).get('status') == 'rejected'
            ),
        },
        'count': len(documents),
        'client_id': client_id,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_client_document_download(request, document_id):
    """GET /bank/client-documents/<document_id>/download/"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    document, client = _get_scoped_client_owned_document(request.user, document_id)
    if not document or not client or not document.file:
        return Response({'error': 'Document client introuvable.'}, status=404)

    response = FileResponse(document.file.open('rb'), as_attachment=False, filename=document.filename)
    response['X-Client-Document-Owner'] = str(client.id)
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bank_client_document_review(request, document_id):
    """POST /bank/client-documents/<document_id>/review/"""
    if request.user.user_type not in ('bank', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    document, client = _get_scoped_client_owned_document(request.user, document_id)
    if not document or not client:
        return Response({'error': 'Document client introuvable.'}, status=404)

    review_status = str(request.data.get('status') or '').strip().lower()
    notes = str(request.data.get('notes') or '').strip()
    if review_status not in {'approved', 'rejected'}:
        return Response({'error': "Le statut doit être 'approved' ou 'rejected'."}, status=400)
    if review_status == 'rejected' and not notes:
        return Response({'error': 'Un motif est requis pour rejeter un document.'}, status=400)

    analysis = document.ai_analysis or {}
    analysis['bank_review'] = {
        'status': review_status,
        'notes': notes,
        'reviewed_at': timezone.now().isoformat(),
        'reviewed_by': request.user.email or request.user.username,
        'bank_owner_id': getattr(request.user, 'id', None),
    }
    document.ai_analysis = analysis
    document.save(update_fields=['ai_analysis'])

    if document.user_id:
        verdict = 'validé' if review_status == 'approved' else 'rejeté'
        subject = f"Document {verdict} par la banque"
        body = (
            f"Bonjour,\n\nLa banque a {verdict} votre document \"{document.filename}\"."
            f"\n\nCommentaire : {notes or 'Aucun commentaire complémentaire.'}"
            "\n\nConnectez-vous à votre espace TERAS pour consulter l'état complet de votre dossier."
        )
        _send_system_message(
            recipient=document.user,
            message_type='info' if review_status == 'approved' else 'alert',
            subject=subject,
            body=body,
        )

    return Response({
        'message': f"Document {document.filename} {('validé' if review_status == 'approved' else 'rejeté')} et client notifié.",
        'document': _serialize_client_owned_document(document),
    })
