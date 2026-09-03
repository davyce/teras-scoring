# ============================================================
# FICHIER 1: email_service.py
# ============================================================

# backend/admin/services/email_service.py
"""
Service de notifications email pour le système de validation TERAS
"""

import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


class EmailService:
    """Service d'envoi d'emails"""
    
    @staticmethod
    def send_document_approved(user, document):
        """
        Envoie un email quand un document est approuvé
        """
        
        try:
            subject = f"✅ Document approuvé - {document.get_document_type_display()}"
            
            message = f"""
Bonjour {user.get_full_name()},

Votre document "{document.get_document_type_display()}" a été approuvé par notre équipe.

Détails:
- Type: {document.get_document_type_display()}
- Fichier: {document.filename}
- Date de validation: {document.verified_at.strftime('%d/%m/%Y %H:%M') if document.verified_at else 'N/A'}

Votre profil KYC est maintenant à jour.

Cordialement,
L'équipe TERAS
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Email envoyé à {user.email} - Document {document.id} approuvé")
            return True
            
        except Exception as e:
            logger.error(f"Erreur envoi email approbation: {str(e)}")
            return False
    
    @staticmethod
    def send_document_rejected(user, document, reason):
        """
        Envoie un email quand un document est rejeté
        """
        
        try:
            subject = f"❌ Document rejeté - {document.get_document_type_display()}"
            
            message = f"""
Bonjour {user.get_full_name()},

Votre document "{document.get_document_type_display()}" n'a pas pu être validé.

Raison du rejet:
{reason}

Action requise:
Veuillez uploader un nouveau document répondant aux exigences mentionnées ci-dessus.

Détails du document rejeté:
- Type: {document.get_document_type_display()}
- Fichier: {document.filename}
- Date de rejet: {document.verified_at.strftime('%d/%m/%Y %H:%M') if document.verified_at else 'N/A'}

Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe TERAS
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Email envoyé à {user.email} - Document {document.id} rejeté")
            return True
            
        except Exception as e:
            logger.error(f"Erreur envoi email rejet: {str(e)}")
            return False
    
    @staticmethod
    def send_document_flagged(user, document, reason):
        """
        Envoie un email quand un document est signalé
        """
        
        try:
            subject = f"⚠️ Document signalé - Action requise"
            
            message = f"""
Bonjour {user.get_full_name()},

Votre document "{document.get_document_type_display()}" nécessite une vérification complémentaire.

Détails:
{reason}

Notre équipe vous contactera prochainement pour résoudre ce point.

Cordialement,
L'équipe TERAS
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Email envoyé à {user.email} - Document {document.id} signalé")
            return True
            
        except Exception as e:
            logger.error(f"Erreur envoi email signalement: {str(e)}")
            return False
    
    @staticmethod
    def send_kyc_completed(user):
        """
        Envoie un email quand le KYC est complet
        """
        
        try:
            subject = "🎉 Vérification KYC complète !"
            
            message = f"""
Bonjour {user.get_full_name()},

Félicitations ! Votre vérification KYC est maintenant complète.

Vous pouvez désormais accéder à l'ensemble de nos services, notamment:
- Demande de crédit
- Produits bancaires
- Services premium

Votre score TERAS sera bientôt calculé.

Cordialement,
L'équipe TERAS
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Email KYC complet envoyé à {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur envoi email KYC: {str(e)}")
            return False
    
    @staticmethod
    def send_document_uploaded_by_admin(user, document, admin_notes):
        """
        Envoie un email quand un admin upload un document pour l'user
        """
        
        try:
            subject = f"📄 Nouveau document ajouté à votre profil"
            
            message = f"""
Bonjour {user.get_full_name()},

Un administrateur a ajouté un document à votre profil.

Détails:
- Type: {document.get_document_type_display()}
- Statut: Vérifié et approuvé
- Fichier: {document.filename}

Notes de l'administrateur:
{admin_notes if admin_notes else 'Aucune note'}

Votre profil a été mis à jour automatiquement.

Cordialement,
L'équipe TERAS
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"Email upload admin envoyé à {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur envoi email upload admin: {str(e)}")
            return False


# Instance globale
email_service = EmailService()


# ============================================================
# FICHIER 2: tasks.py (Celery)
# ============================================================

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
        from datetime import datetime
        document.ai_analyzed = True
        document.ai_analyzed_at = datetime.now()
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
