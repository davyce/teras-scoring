# backend/admin/tasks.py
"""
Tâches asynchrones Celery pour le système de validation TERAS
"""

import logging
from celery import shared_task
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def analyze_document_task(self, document_id):
    """
    Tâche asynchrone: Analyser un document avec l'IA
    
    Args:
        document_id: ID du document à analyser
    """
    
    try:
        from users.models import Document
        from admin.services.ai_service import ai_analyzer
        from admin.services.legislation_service import legislation_service
        
        logger.info(f"Début analyse asynchrone document {document_id}")
        
        # Récupérer le document
        document = Document.objects.select_related('user').get(id=document_id)
        user = document.user
        
        # Récupérer contexte législatif
        legislation_context = legislation_service.get_relevant_legislation(
            country=user.country,
            document_type=document.document_type
        )
        
        # Analyser avec l'IA
        analysis_result = ai_analyzer.analyze_document(
            document=document,
            user=user,
            legislation_context=legislation_context
        )
        
        # Sauvegarder les résultats
        from django.utils import timezone
        document.ai_analyzed = True
        document.ai_analyzed_at = timezone.now()
        document.ai_confidence_score = analysis_result.get('confidence_score', 0)
        document.ai_recommendation = analysis_result.get('recommendation', 'review')
        document.ai_analysis_json = analysis_result
        document.extracted_data = analysis_result.get('extracted_data', {})
        document.save()
        
        logger.info(f"Analyse document {document_id} terminée: {document.ai_recommendation}")
        
        return {
            'success': True,
            'document_id': document_id,
            'recommendation': document.ai_recommendation,
            'confidence': document.ai_confidence_score
        }
        
    except Document.DoesNotExist:
        logger.error(f"Document {document_id} introuvable")
        return {'success': False, 'error': 'Document introuvable'}
        
    except Exception as e:
        logger.error(f"Erreur analyse document {document_id}: {str(e)}")
        
        # Retry avec backoff exponentiel
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def index_legislation_task(self, legislation_id):
    """
    Tâche asynchrone: Indexer un document législatif
    
    Args:
        legislation_id: ID du document législatif
    """
    
    try:
        from users.models import LegislationDocument
        from admin.services.legislation_service import legislation_service
        
        logger.info(f"Début indexation législation {legislation_id}")
        
        # Récupérer le document
        legislation_doc = LegislationDocument.objects.get(id=legislation_id)
        
        # Indexer
        result = legislation_service.index_legislation_document(legislation_doc)
        
        if result['success']:
            logger.info(f"Législation {legislation_id} indexée: {result['chunks_count']} chunks")
        else:
            logger.error(f"Échec indexation législation {legislation_id}: {result.get('error')}")
        
        return result
        
    except LegislationDocument.DoesNotExist:
        logger.error(f"Document législatif {legislation_id} introuvable")
        return {'success': False, 'error': 'Document introuvable'}
        
    except Exception as e:
        logger.error(f"Erreur indexation législation {legislation_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@shared_task
def send_email_task(email_type, user_id, **kwargs):
    """
    Tâche asynchrone: Envoyer un email
    
    Args:
        email_type: Type d'email (approved, rejected, flagged, kyc_complete, admin_upload)
        user_id: ID de l'utilisateur
        **kwargs: Paramètres supplémentaires
    """
    
    try:
        from admin.services.email_service import email_service
        from users.models import Document
        
        user = User.objects.get(id=user_id)
        
        if email_type == 'approved':
            document = Document.objects.get(id=kwargs.get('document_id'))
            email_service.send_document_approved(user, document)
            
        elif email_type == 'rejected':
            document = Document.objects.get(id=kwargs.get('document_id'))
            reason = kwargs.get('reason', 'Non spécifié')
            email_service.send_document_rejected(user, document, reason)
            
        elif email_type == 'flagged':
            document = Document.objects.get(id=kwargs.get('document_id'))
            reason = kwargs.get('reason', 'Vérification complémentaire requise')
            email_service.send_document_flagged(user, document, reason)
            
        elif email_type == 'kyc_complete':
            email_service.send_kyc_completed(user)
            
        elif email_type == 'admin_upload':
            document = Document.objects.get(id=kwargs.get('document_id'))
            notes = kwargs.get('admin_notes', '')
            email_service.send_document_uploaded_by_admin(user, document, notes)
        
        logger.info(f"Email {email_type} envoyé à user {user_id}")
        return {'success': True}
        
    except Exception as e:
        logger.error(f"Erreur envoi email {email_type} à user {user_id}: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def batch_analyze_documents():
    """
    Tâche périodique: Analyser tous les documents en attente
    Exécuter via Celery Beat (toutes les 10 minutes)
    """
    
    try:
        from users.models import Document
        
        # Documents pending sans analyse IA
        pending_docs = Document.objects.filter(
            status='pending',
            ai_analyzed=False
        )
        
        count = 0
        for doc in pending_docs[:10]:  # Max 10 par batch
            analyze_document_task.delay(doc.id)
            count += 1
        
        logger.info(f"Batch analyze lancé pour {count} documents")
        return {'success': True, 'count': count}
        
    except Exception as e:
        logger.error(f"Erreur batch analyze: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def cleanup_old_analysis():
    """
    Tâche périodique: Nettoyer les anciennes analyses (optionnel)
    Exécuter via Celery Beat (toutes les 24h)
    """
    
    try:
        from users.models import Document
        from datetime import timedelta
        from django.utils import timezone
        
        # Documents analysés il y a plus de 90 jours
        cutoff_date = timezone.now() - timedelta(days=90)
        
        old_docs = Document.objects.filter(
            ai_analyzed=True,
            ai_analyzed_at__lt=cutoff_date
        )
        
        # Option: Archiver ou supprimer les anciennes analyses
        # Pour l'instant, juste compter
        count = old_docs.count()
        
        logger.info(f"Trouvé {count} anciennes analyses (>90 jours)")
        return {'success': True, 'count': count}
        
    except Exception as e:
        logger.error(f"Erreur cleanup: {str(e)}")
        return {'success': False, 'error': str(e)}
