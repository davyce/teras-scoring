# backend/scoring/views_admin_documents.py
"""
TERAS Admin Documents — Gestion documentaire côté administrateur
L'admin peut :
  - Voir TOUS les documents de TOUS les utilisateurs
  - Uploader des documents dans le RAG (législation, règlements CEMAC)
  - Supprimer des documents utilisateurs
  - Statistiques globales documents

Endpoints :
  GET  /admin/documents/all/           Tous les docs de tous les users
  POST /admin/documents/rag-upload/    Upload doc dans le RAG
  GET  /admin/documents/rag-list/      Liste docs RAG
  DELETE /admin/documents/rag/<id>/delete/  Supprimer doc RAG
  GET  /admin/documents/stats/         Statistiques globales
  GET  /admin/users/<user_id>/documents/    Docs d'un user spécifique
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models_enterprise import EnterpriseDocument

logger   = logging.getLogger(__name__)
User     = get_user_model()

ALLOWED_EXTENSIONS = {
    'pdf', 'xlsx', 'xls', 'csv', 'ofx', 'txt', 'docx', 'doc',
    'jpg', 'jpeg', 'png',
}


def _get_result_path(doc_path: str) -> str:
    return doc_path + '.result.json'


def _load_result(doc_path: str) -> dict:
    try:
        rp = _get_result_path(doc_path)
        if os.path.exists(rp):
            with open(rp, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _list_user_documents(user_id: int) -> list:
    """Liste les documents d'un utilisateur individuel."""
    from .document_parser import detect_format
    doc_dir = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'),
        'documents', str(user_id)
    )
    docs = []
    if not os.path.exists(doc_dir):
        return docs

    for fname in os.listdir(doc_dir):
        if fname.endswith('.result.json'):
            continue
        ext = Path(fname).suffix.lower().lstrip('.')
        if ext not in ALLOWED_EXTENSIONS:
            continue
        fpath  = os.path.join(doc_dir, fname)
        stat   = os.stat(fpath)
        result = _load_result(fpath)
        docs.append({
            'id':          fname,
            'user_id':     user_id,
            'filename':    fname,
            'display_name': _display_name(fname),
            'size_bytes':  stat.st_size,
            'size_mb':     round(stat.st_size / (1024 * 1024), 2),
            'format':      result.get('format', detect_format(fpath, fname)),
            'uploaded_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'status':      result.get('status', 'uploaded'),
            'transactions_count': len(result.get('transactions', [])),
            'authenticity_score': result.get('quality', {}).get('authenticity_score', 0),
            'doc_type':    result.get('doc_type', 'other'),
        })

    return docs


def _display_name(file_name: str, fallback: str | None = None) -> str:
    parts = file_name.split("_", 2)
    if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
        return parts[2]
    return fallback or file_name


def _build_user_info(user_id: int) -> dict:
    try:
        user = User.objects.get(id=user_id)
        return {
            'id':        user.id,
            'email':     user.email,
            'name':      user.get_full_name() or user.email,
            'user_type': user.user_type,
        }
    except User.DoesNotExist:
        return {'id': user_id, 'email': f'user_{user_id}', 'name': f'Compte #{user_id}', 'user_type': 'unknown'}


def _document_family(file_name: str, source_kind: str, raw_type: str = '') -> str:
    lowered = file_name.lower()
    raw = (raw_type or '').lower()

    if 'asset' in lowered or 'fixed_assets' in lowered or raw == 'proof_asset':
        return 'asset'
    if 'bank_statement' in lowered or 'income_expenses' in lowered or 'sales_register' in lowered or 'purchase_register' in lowered or raw in {'bank_statement', 'salary_slip', 'invoice'}:
        return 'financial'
    if 'invoice' in lowered or raw == 'invoice':
        return 'invoice'
    if 'identity' in lowered or raw == 'identity':
        return 'identity'
    if 'address' in lowered:
        return 'address'
    if 'employment' in lowered or 'salary' in lowered or raw in {'salary_slip', 'payroll'}:
        return 'income_support'
    if 'contract' in lowered or raw == 'contract':
        return 'contract'
    if 'ocr' in lowered:
        return 'ocr_reference'
    if source_kind == 'bank' and ('institution' in lowered or 'credit_products' in lowered or 'coverage' in lowered or 'portfolio_snapshot' in lowered):
        return 'institutional'
    if raw in {'balance_sheet', 'tax_filing'}:
        return 'enterprise_finance'
    return 'other'


def _parse_expected(document_family: str) -> bool:
    return document_family in {'financial', 'invoice'}


def _display_status(raw_status: str, parse_expected: bool) -> str:
    if raw_status == 'parsed':
        return 'parsed'
    if raw_status == 'processing':
        return 'processing'
    if not parse_expected:
        return 'informational'
    if raw_status in {'pending', 'validated', 'rejected'}:
        return raw_status
    return raw_status or 'uploaded'


def _download_url(source_kind: str, document_id: str | int, owner_id: int | None = None) -> str:
    owner_part = f"&owner_id={owner_id}" if owner_id is not None else ""
    return f"/api/scoring/admin/documents/download/?source_kind={source_kind}&document_id={quote(str(document_id))}{owner_part}"


def _serialize_user_document(doc: dict, user_info: dict) -> dict:
    document_family = _document_family(doc['filename'], 'user', doc.get('doc_type', ''))
    parse_expected = _parse_expected(document_family)
    return {
        **doc,
        'source_kind': 'user',
        'source_label': 'Individuel',
        'document_family': document_family,
        'parse_expected': parse_expected,
        'display_status': _display_status(doc.get('status', 'uploaded'), parse_expected),
        'download_url': _download_url('user', doc['id'], user_info['id']),
        'user': user_info,
    }


def _list_enterprise_documents() -> list:
    docs = []
    queryset = EnterpriseDocument.objects.select_related('enterprise').order_by('-uploaded_at')
    for doc in queryset:
        user_info = {
            'id': doc.enterprise.id,
            'email': doc.enterprise.email,
            'name': doc.enterprise.get_full_name() or getattr(doc.enterprise, 'company_name', None) or doc.enterprise.email,
            'user_type': doc.enterprise.user_type,
        }
        file_name = Path(doc.file.name).name if doc.file else doc.title
        size_bytes = doc.file.size if doc.file else 0
        document_family = _document_family(file_name, 'enterprise', doc.category)
        parse_expected = _parse_expected(document_family)
        docs.append({
            'id': str(doc.id),
            'user_id': doc.enterprise.id,
            'filename': file_name,
            'display_name': doc.title or file_name,
            'size_bytes': size_bytes,
            'size_mb': round(size_bytes / (1024 * 1024), 2),
            'format': Path(file_name).suffix.lower().lstrip('.') or 'unknown',
            'uploaded_at': doc.uploaded_at.isoformat(),
            'status': doc.status,
            'display_status': _display_status(doc.status, parse_expected),
            'transactions_count': 0,
            'authenticity_score': 0,
            'doc_type': doc.category,
            'source_kind': 'enterprise',
            'source_label': 'Entreprise',
            'document_family': document_family,
            'parse_expected': parse_expected,
            'download_url': _download_url('enterprise', doc.id),
            'user': user_info,
        })
    return docs


def _list_bank_documents_admin() -> list:
    from .views_bank_documents import _list_bank_docs

    docs = []
    base_dir = os.path.join(getattr(settings, 'MEDIA_ROOT', 'media'), 'bank_documents')
    if not os.path.exists(base_dir):
        return docs

    for bank_user_id_str in os.listdir(base_dir):
        if not bank_user_id_str.isdigit():
            continue
        bank_user_id = int(bank_user_id_str)
        user_info = _build_user_info(bank_user_id)
        for doc in _list_bank_docs(bank_user_id):
            document_family = _document_family(doc['filename'], 'bank', doc.get('doc_type', ''))
            parse_expected = _parse_expected(document_family)
            size_bytes = 0
            for root, _dirs, files in os.walk(os.path.join(base_dir, bank_user_id_str)):
                if doc['filename'] in files:
                    size_bytes = os.stat(os.path.join(root, doc['filename'])).st_size
                    break
            docs.append({
                **doc,
                'user_id': bank_user_id,
                'display_name': _display_name(doc['filename']),
                'size_bytes': size_bytes,
                'size_mb': round(size_bytes / (1024 * 1024), 2) if size_bytes else doc.get('size_mb', 0),
                'source_kind': 'bank',
                'source_label': 'Banque',
                'document_family': document_family,
                'parse_expected': parse_expected,
                'display_status': _display_status(doc.get('status', 'uploaded'), parse_expected),
                'download_url': _download_url('bank', doc['id'], bank_user_id),
                'user': user_info,
            })
    return docs


def _collect_admin_documents() -> list:
    media_docs = os.path.join(getattr(settings, 'MEDIA_ROOT', 'media'), 'documents')
    all_docs = []

    if os.path.exists(media_docs):
        for user_id_str in os.listdir(media_docs):
            if not user_id_str.isdigit():
                continue
            user_id = int(user_id_str)
            user_info = _build_user_info(user_id)
            for doc in _list_user_documents(user_id):
                all_docs.append(_serialize_user_document(doc, user_info))

    all_docs.extend(_list_enterprise_documents())
    all_docs.extend(_list_bank_documents_admin())
    all_docs.sort(key=lambda d: d['uploaded_at'], reverse=True)
    return all_docs


def _get_rag_dir() -> str:
    rag_dir = os.path.join(
        getattr(settings, 'MEDIA_ROOT', 'media'), 'rag_documents'
    )
    os.makedirs(rag_dir, exist_ok=True)
    return rag_dir


# ─── ENDPOINTS ────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_all_documents(request):
    """GET /admin/documents/all/ — Tous les documents de tous les utilisateurs"""
    if request.user.user_type != 'admin':
        return Response({'error': 'Accès refusé.'}, status=403)

    all_docs = _collect_admin_documents()

    return Response({
        'documents': all_docs,
        'count':     len(all_docs),
        'stats': {
            'users_with_docs': len(set(d['user_id'] for d in all_docs)),
            'analyzable_docs': sum(1 for d in all_docs if d.get('parse_expected')),
            'informational_docs': sum(1 for d in all_docs if not d.get('parse_expected')),
            'parsed':          sum(1 for d in all_docs if d['status'] == 'parsed'),
            'processing':      sum(1 for d in all_docs if d['status'] == 'processing'),
            'failed':          sum(1 for d in all_docs if d['status'] == 'failed'),
            'by_source': {
                'user': sum(1 for d in all_docs if d['source_kind'] == 'user'),
                'enterprise': sum(1 for d in all_docs if d['source_kind'] == 'enterprise'),
                'bank': sum(1 for d in all_docs if d['source_kind'] == 'bank'),
            },
            'total_size_mb':   round(sum(d['size_bytes'] for d in all_docs) / (1024 * 1024), 1),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_documents(request, user_id):
    """GET /admin/users/<user_id>/documents/ — Docs d'un utilisateur"""
    if request.user.user_type != 'admin':
        return Response({'error': 'Accès refusé.'}, status=403)

    user_info = _build_user_info(user_id)
    docs = [_serialize_user_document(doc, user_info) for doc in _list_user_documents(user_id)]

    return Response({'user': user_info, 'documents': docs, 'count': len(docs)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_document_download(request):
    """GET /admin/documents/download/?source_kind=user|enterprise|bank&document_id=...&owner_id=..."""
    if request.user.user_type != 'admin':
        return Response({'error': 'Accès refusé.'}, status=403)

    source_kind = request.GET.get('source_kind')
    document_id = request.GET.get('document_id')
    owner_id = request.GET.get('owner_id')

    if not source_kind or not document_id:
        return Response({'error': 'Paramètres incomplets.'}, status=400)

    if source_kind == 'user':
        if not owner_id or not owner_id.isdigit():
            return Response({'error': 'owner_id requis pour un document utilisateur.'}, status=400)
        file_path = os.path.join(getattr(settings, 'MEDIA_ROOT', 'media'), 'documents', owner_id, document_id)
        if not os.path.exists(file_path):
            return Response({'error': 'Document utilisateur non trouvé.'}, status=404)
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=document_id)

    if source_kind == 'bank':
        if not owner_id or not owner_id.isdigit():
            return Response({'error': 'owner_id requis pour un document banque.'}, status=400)
        base_dir = os.path.join(getattr(settings, 'MEDIA_ROOT', 'media'), 'bank_documents', owner_id)
        for root, _dirs, files in os.walk(base_dir):
            if document_id in files:
                file_path = os.path.join(root, document_id)
                return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=document_id)
        return Response({'error': 'Document banque non trouvé.'}, status=404)

    if source_kind == 'enterprise':
        try:
            doc = EnterpriseDocument.objects.select_related('enterprise').get(id=int(document_id))
        except (ValueError, EnterpriseDocument.DoesNotExist):
            return Response({'error': 'Document entreprise non trouvé.'}, status=404)
        if not doc.file or not os.path.exists(doc.file.path):
            return Response({'error': 'Fichier entreprise introuvable.'}, status=404)
        return FileResponse(open(doc.file.path, 'rb'), as_attachment=True, filename=Path(doc.file.name).name)

    return Response({'error': 'source_kind invalide.'}, status=400)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def admin_rag_upload(request):
    """POST /admin/documents/rag-upload/ — Upload document dans la base RAG"""
    if request.user.user_type != 'admin':
        return Response({'error': 'Accès refusé.'}, status=403)

    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'Aucun fichier.'}, status=400)

    filename = file.name
    ext      = Path(filename).suffix.lower().lstrip('.')
    if ext not in {'pdf', 'txt', 'docx', 'xlsx', 'csv'}:
        return Response({'error': f"Format '{ext}' non supporté pour RAG. Utilisez PDF, TXT, DOCX."}, status=400)

    if file.size > 50 * 1024 * 1024:
        return Response({'error': 'Fichier trop volumineux (max 50 MB pour RAG).'}, status=400)

    rag_dir   = _get_rag_dir()
    ts        = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_name = f"{ts}_{filename.replace(' ', '_')}"
    file_path = os.path.join(rag_dir, safe_name)

    with open(file_path, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)

    doc_type    = request.data.get('doc_type', 'legislation')
    description = request.data.get('description', '')
    language    = request.data.get('language', 'fr')

    # Métadonnées RAG
    meta = {
        'filename':    safe_name,
        'original':    filename,
        'doc_type':    doc_type,
        'description': description,
        'language':    language,
        'indexed':     False,
        'uploaded_by': request.user.email,
        'uploaded_at': datetime.now().isoformat(),
    }
    with open(file_path + '.meta.json', 'w') as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    # Tenter l'indexation RAG (si le service est dispo)
    indexed = False
    try:
        from ai.rag_service import index_document
        index_document(file_path, meta)
        meta['indexed'] = True
        indexed         = True
        with open(file_path + '.meta.json', 'w') as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
    except ImportError:
        pass  # RAG non disponible
    except Exception as e:
        logger.warning(f"RAG indexing failed for {safe_name}: {e}")

    return Response({
        'message':   f"Document '{filename}' uploadé {'et indexé dans le RAG' if indexed else '(indexation RAG en attente)'}.",
        'filename':  safe_name,
        'indexed':   indexed,
        'doc_type':  doc_type,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_rag_list(request):
    """GET /admin/documents/rag-list/ — Liste des documents RAG"""
    if request.user.user_type != 'admin':
        return Response({'error': 'Accès refusé.'}, status=403)

    rag_dir = _get_rag_dir()
    docs    = []

    for fname in os.listdir(rag_dir):
        if fname.endswith('.meta.json') or fname.endswith('.result.json'):
            continue

        meta_path = os.path.join(rag_dir, fname + '.meta.json')
        fpath     = os.path.join(rag_dir, fname)

        if not os.path.exists(fpath):
            continue

        stat = os.stat(fpath)
        meta = {}
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r') as f:
                    meta = json.load(f)
            except Exception:
                pass

        docs.append({
            'id':           fname,
            'filename':     fname,
            'original':     meta.get('original', fname),
            'doc_type':     meta.get('doc_type', 'unknown'),
            'description':  meta.get('description', ''),
            'language':     meta.get('language', 'fr'),
            'indexed':      meta.get('indexed', False),
            'uploaded_by':  meta.get('uploaded_by', ''),
            'uploaded_at':  meta.get('uploaded_at', datetime.fromtimestamp(stat.st_ctime).isoformat()),
            'size_mb':      round(stat.st_size / (1024 * 1024), 2),
        })

    docs.sort(key=lambda d: d['uploaded_at'], reverse=True)
    return Response({'documents': docs, 'count': len(docs)})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_rag_delete(request, doc_id):
    """DELETE /admin/documents/rag/<doc_id>/delete/"""
    if request.user.user_type != 'admin':
        return Response({'error': 'Accès refusé.'}, status=403)

    rag_dir   = _get_rag_dir()
    file_path = os.path.join(rag_dir, doc_id)

    if not os.path.exists(file_path):
        return Response({'error': 'Document RAG non trouvé.'}, status=404)

    os.remove(file_path)
    meta_path = file_path + '.meta.json'
    if os.path.exists(meta_path):
        os.remove(meta_path)

    return Response({'message': 'Document RAG supprimé.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_documents_stats(request):
    """GET /admin/documents/stats/ — Statistiques globales documents"""
    if request.user.user_type != 'admin':
        return Response({'error': 'Accès refusé.'}, status=403)

    rag_dir    = _get_rag_dir()
    all_docs = _collect_admin_documents()

    rag_docs = sum(1 for f in os.listdir(rag_dir) if not f.endswith('.json')) if os.path.exists(rag_dir) else 0

    return Response({
        'user_documents': {
            'total_users':  len(set(d['user_id'] for d in all_docs)),
            'total_docs':   len(all_docs),
            'parsed':       sum(1 for d in all_docs if d['status'] == 'parsed'),
            'analyzable_docs': sum(1 for d in all_docs if d.get('parse_expected')),
            'informational_docs': sum(1 for d in all_docs if not d.get('parse_expected')),
            'by_source': {
                'user': sum(1 for d in all_docs if d['source_kind'] == 'user'),
                'enterprise': sum(1 for d in all_docs if d['source_kind'] == 'enterprise'),
                'bank': sum(1 for d in all_docs if d['source_kind'] == 'bank'),
            },
            'total_size_mb': round(sum(d['size_bytes'] for d in all_docs) / (1024 * 1024), 1),
        },
        'rag_documents': {
            'total':   rag_docs,
            'indexed': rag_docs,  # approximation
        },
    })
