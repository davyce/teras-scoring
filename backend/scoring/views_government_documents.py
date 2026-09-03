# backend/scoring/views_government_documents.py
"""
TERAS Government Documents — Gestion documentaire côté gouvernement
Le gouvernement peut :
  - Uploader des données économiques nationales (CSV, Excel, PDF)
  - Analyser les documents avec IA contextualisée gouvernement CEMAC
  - Générer des rapports basés sur les données importées
  - Exporter et télécharger les documents

Endpoints :
  POST /government/documents/upload/         Upload données économiques
  GET  /government/documents/list/           Liste documents gouvernement
  GET  /government/documents/<id>/           Détail document
  DELETE /government/documents/<id>/delete/  Supprimer
  GET  /government/documents/<id>/download/  Télécharger
  POST /government/documents/<id>/analyze/   Analyse IA contexte gouvernement
"""

import os
import json
import threading
import logging
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .document_parser import parse_document, detect_format

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    'pdf', 'xlsx', 'xls', 'csv', 'txt', 'docx', 'doc',
}
MAX_UPLOAD_BYTES = 30 * 1024 * 1024   # 30 MB pour gouvernement
SYNC_MAX_BYTES   = 2 * 1024 * 1024


def _finalize_parse_status(result: dict) -> dict:
    errors = [str(err).strip() for err in result.get('errors', []) if str(err).strip()]
    parsing_success = bool(result.get('parsing_success'))

    if parsing_success:
        status_value = 'parsed'
        display_status = 'analyzed'
        message = 'Document gouvernemental enregistré et analysé.'
    elif errors:
        status_value = 'failed'
        display_status = 'failed'
        message = 'Document gouvernemental enregistré, mais l’analyse structurée a échoué.'
    else:
        status_value = 'uploaded'
        display_status = 'stored'
        message = 'Document gouvernemental enregistré. Analyse structurée non applicable ou aucune donnée exploitable détectée.'

    result['status'] = status_value
    result['display_status'] = display_status
    result['parse_expected'] = False
    result['message'] = message
    return result


def _get_gov_doc_dir(user_id: int, country: str = 'CG') -> str:
    base = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'government_documents', str(user_id), country
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


def _list_gov_docs(user_id: int, country: str = None) -> list:
    base = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'government_documents', str(user_id)
    )
    docs = []
    if not os.path.exists(base):
        return docs

    scan_dirs = []
    if country:
        d = os.path.join(base, country)
        if os.path.exists(d):
            scan_dirs = [(d, country)]
    else:
        for sub in os.listdir(base):
            sp = os.path.join(base, sub)
            if os.path.isdir(sp):
                scan_dirs.append((sp, sub))

    for (ddir, ctry) in scan_dirs:
        for fname in os.listdir(ddir):
            if fname.endswith('.result.json'):
                continue
            ext = Path(fname).suffix.lower().lstrip('.')
            if ext not in ALLOWED_EXTENSIONS:
                continue
            fpath  = os.path.join(ddir, fname)
            stat   = os.stat(fpath)
            result = _load_result(fpath)
            if result.get('status') != 'processing':
                result = _finalize_parse_status(result)
            docs.append({
                'id':                fname,
                'filename':          fname,
                'country':           ctry,
                'size_bytes':        stat.st_size,
                'size_mb':           round(stat.st_size / (1024 * 1024), 2),
                'format':            result.get('format', detect_format(fpath, fname)),
                'uploaded_at':       datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'doc_type':          result.get('doc_type', 'economic_data'),
                'status':            result.get('status', 'uploaded'),
                'display_status':    result.get('display_status', result.get('status', 'uploaded')),
                'parse_expected':    result.get('parse_expected', False),
                'transactions_count':len(result.get('transactions', [])),
                'authenticity_score':result.get('quality', {}).get('authenticity_score', 0),
                'message':           result.get('message', ''),
            })

    docs.sort(key=lambda d: d['uploaded_at'], reverse=True)
    return docs


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def government_upload_document(request):
    """POST /government/documents/upload/"""
    if request.user.user_type not in ('government', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'Aucun fichier.'}, status=400)

    filename = file.name
    ext      = Path(filename).suffix.lower().lstrip('.')
    if ext not in ALLOWED_EXTENSIONS:
        return Response({'error': f"Format '{ext}' non supporté."}, status=400)
    if file.size > MAX_UPLOAD_BYTES:
        return Response({'error': 'Fichier trop volumineux (max 30 MB).'}, status=400)

    country  = getattr(request.user, 'country', 'CG') or 'CG'
    doc_type = request.data.get('doc_type', 'economic_data')
    desc     = request.data.get('description', '')
    period   = request.data.get('period', '')    # Ex: "2025-Q4"

    doc_dir   = _get_gov_doc_dir(request.user.id, country)
    ts        = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_name = f"{ts}_{filename.replace(' ', '_')}"
    file_path = os.path.join(doc_dir, safe_name)

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
        result['doc_type']    = doc_type
        result['description'] = desc
        result['period']      = period
        result['country']     = country
        result = _finalize_parse_status(result)
        _save_result(file_path, result)

        return Response({
            'status':             result['status'],
            'filename':           safe_name,
            'format':             result['format'],
            'transactions_count': len(result['transactions']),
            'authenticity_score': result['quality'].get('authenticity_score', 0),
            'teras_signals':      result['teras_signals'],
            'recommendations':    result['recommendations'],
            'message':            result['message'],
            'display_status':     result['display_status'],
            'parse_expected':     result['parse_expected'],
        })
    else:
        _save_result(file_path, {
            'status': 'processing', 'display_status': 'processing', 'doc_type': doc_type,
            'country': country, 'period': period, 'parse_expected': False,
            'message': 'Document gouvernemental enregistré. Analyse en arrière-plan en cours.'
        })

        def _async():
            try:
                result = parse_document(file_path, filename, mime_type)
                result['doc_type']    = doc_type
                result['description'] = desc
                result['period']      = period
                result['country']     = country
                result = _finalize_parse_status(result)
                _save_result(file_path, result)
            except Exception as exc:
                _save_result(file_path, {
                    'status': 'failed',
                    'display_status': 'failed',
                    'doc_type': doc_type,
                    'country': country,
                    'period': period,
                    'parse_expected': False,
                    'errors': [str(exc)],
                    'message': 'Document gouvernemental enregistré, mais l’analyse structurée a échoué.',
                })

        threading.Thread(target=_async, daemon=True).start()
        return Response({
            'status': 'processing',
            'filename': safe_name,
            'message': 'Document gouvernemental enregistré. Analyse en arrière-plan en cours.',
            'display_status': 'processing',
            'parse_expected': False,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_list_documents(request):
    """GET /government/documents/list/"""
    if request.user.user_type not in ('government', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    country = getattr(request.user, 'country', None)
    docs    = _list_gov_docs(request.user.id, country)

    return Response({
        'documents': docs,
        'count':     len(docs),
        'country':   country,
        'summary': {
            'parsed':     sum(1 for d in docs if d['status'] == 'parsed'),
            'processing': sum(1 for d in docs if d['status'] == 'processing'),
            'uploaded':   sum(1 for d in docs if d['status'] == 'uploaded'),
            'total_size_mb': round(sum(d['size_mb'] for d in docs), 1),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_document_detail(request, doc_id):
    """GET /government/documents/<doc_id>/"""
    if request.user.user_type not in ('government', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    country = getattr(request.user, 'country', 'CG') or 'CG'
    base    = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'government_documents', str(request.user.id), country
    )
    file_path = os.path.join(base, doc_id)
    if not os.path.exists(file_path):
        return Response({'error': 'Document non trouvé.'}, status=404)

    result = _load_result(file_path)
    if result.get('status') != 'processing':
        result = _finalize_parse_status(result)
    stat   = os.stat(file_path)
    include_txns = request.GET.get('include_transactions', '0') == '1'

    data = {
        'id':          doc_id,
        'filename':    doc_id,
        'size_mb':     round(stat.st_size / (1024 * 1024), 2),
        'format':      result.get('format', 'unknown'),
        'status':      result.get('status', 'uploaded'),
        'display_status': result.get('display_status', result.get('status', 'uploaded')),
        'parse_expected': result.get('parse_expected', False),
        'doc_type':    result.get('doc_type', 'economic_data'),
        'country':     result.get('country', country),
        'period':      result.get('period', ''),
        'uploaded_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
        'transactions_count': len(result.get('transactions', [])),
        'quality':     result.get('quality', {}),
        'teras_signals': result.get('teras_signals', {}),
        'recommendations': result.get('recommendations', []),
        'errors':      result.get('errors', []),
        'message':     result.get('message', ''),
    }
    if include_txns:
        data['transactions'] = result.get('transactions', [])[:200]

    return Response(data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def government_delete_document(request, doc_id):
    """DELETE /government/documents/<doc_id>/delete/"""
    if request.user.user_type not in ('government', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    country   = getattr(request.user, 'country', 'CG') or 'CG'
    file_path = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'government_documents', str(request.user.id), country, doc_id
    )
    if not os.path.exists(file_path):
        return Response({'error': 'Document non trouvé.'}, status=404)

    os.remove(file_path)
    rp = _get_result_path(file_path)
    if os.path.exists(rp):
        os.remove(rp)
    return Response({'message': 'Document supprimé.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def government_download_document(request, doc_id):
    """GET /government/documents/<doc_id>/download/"""
    if request.user.user_type not in ('government', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    country   = getattr(request.user, 'country', 'CG') or 'CG'
    file_path = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'government_documents', str(request.user.id), country, doc_id
    )
    if not os.path.exists(file_path):
        return Response({'error': 'Document non trouvé.'}, status=404)

    return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=doc_id)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def government_analyze_document(request, doc_id):
    """POST /government/documents/<doc_id>/analyze/ — Analyse IA contexte gouvernement"""
    import requests as req

    if request.user.user_type not in ('government', 'admin'):
        return Response({'error': 'Accès refusé.'}, status=403)

    country   = getattr(request.user, 'country', 'CG') or 'CG'
    file_path = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'government_documents', str(request.user.id), country, doc_id
    )
    if not os.path.exists(file_path):
        return Response({'error': 'Document non trouvé.'}, status=404)

    result  = _load_result(file_path)
    signals = result.get('teras_signals', {})
    quality = result.get('quality', {})
    stats   = quality.get('stats', {})

    CEMAC_COUNTRIES = {
        'CG': 'Congo Brazzaville', 'CM': 'Cameroun', 'GA': 'Gabon',
        'CF': 'Centrafrique',      'TD': 'Tchad',    'GQ': 'Guinée Équatoriale',
    }

    prompt = f"""Tu es le Conseiller IA TERAS pour le gouvernement du {CEMAC_COUNTRIES.get(country, country)}.
Analyse ce document économique et fournis une analyse de niveau ministériel.

DONNÉES DU DOCUMENT :
- Type : {result.get('doc_type', 'données économiques')}
- Période : {result.get('period', 'N/A')}
- Lignes/transactions analysées : {stats.get('total_transactions', 0)}
- Authenticité document : {quality.get('authenticity_score', 0) * 100:.0f}%
- Total flux entrants : {stats.get('total_credits_xaf', 0):,.0f} FCFA
- Total flux sortants : {stats.get('total_debits_xaf', 0):,.0f} FCFA
- Balance nette : {stats.get('net_cashflow_xaf', 0):,.0f} FCFA
- Revenu/recettes moyens : {signals.get('income_signal', {}).get('monthly_avg_xaf', 0):,.0f} FCFA/mois
- Période couverte : {stats.get('months_covered', 0)} mois
  ({stats.get('date_from', 'N/A')} → {stats.get('date_to', 'N/A')})

INSTRUCTIONS :
1. **Synthèse exécutive** (3 phrases) — pour présentation présidentielle
2. **Indicateurs clés** — revenus, dépenses, balance, tendances
3. **Implications politiques** — ce que ces données suggèrent comme action gouvernementale
4. **Comparaison CEMAC** — positionnement par rapport aux voisins
5. **Recommandations** — 3 mesures concrètes actionnables
6. **Risques identifiés** — alertes et points de vigilance

Ton professionnel et précis, chiffres en FCFA.
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
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        response.raise_for_status()
        analysis = response.json()['content'][0]['text']

        return Response({
            'analysis':  analysis,
            'country':   country,
            'doc_id':    doc_id,
            'analyzed_at': datetime.now().isoformat(),
        })
    except Exception as e:
        return Response({'error': f"Erreur IA : {e}"}, status=503)
