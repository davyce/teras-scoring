# backend/scoring/upload_utils.py
"""
Utilitaires centralisés pour la validation des fichiers uploadés.
Réutilisé par views_kyc, views_documents, views_support_user, etc.
"""

import os
from rest_framework.response import Response

MAX_UPLOAD_BYTES = 15 * 1024 * 1024  # 15 MB

ALLOWED_DOCUMENT_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'webp'}

ALLOWED_FINANCIAL_EXTENSIONS = {'pdf', 'xlsx', 'xls', 'csv', 'jpg', 'jpeg', 'png', 'webp'}

ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
}


def validate_upload(file, allowed_extensions=None, max_bytes=MAX_UPLOAD_BYTES):
    """
    Valide un fichier uploadé (extension, taille, MIME type).
    Retourne (True, None) si valide, (False, Response_erreur) sinon.
    """
    if allowed_extensions is None:
        allowed_extensions = ALLOWED_DOCUMENT_EXTENSIONS

    if not file:
        return False, Response({'error': 'Aucun fichier fourni.'}, status=400)

    # Validation taille
    if file.size > max_bytes:
        mb = round(file.size / 1024 / 1024, 1)
        max_mb = round(max_bytes / 1024 / 1024, 1)
        return False, Response(
            {'error': f'Fichier trop volumineux ({mb} MB). Maximum : {max_mb} MB.'},
            status=400,
        )

    # Validation extension
    ext = os.path.splitext(file.name)[1].lower().lstrip('.')
    if ext not in allowed_extensions:
        return False, Response(
            {
                'error': f"Extension '.{ext}' non autorisée.",
                'allowed': sorted(list(allowed_extensions)),
            },
            status=400,
        )

    # Validation MIME type basique (content_type fourni par le client)
    content_type = getattr(file, 'content_type', '') or ''
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        return False, Response(
            {'error': f"Type MIME '{content_type}' non autorisé."},
            status=400,
        )

    return True, None
