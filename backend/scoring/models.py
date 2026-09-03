# backend/scoring/models.py
"""
Modèles TERAS - VERSION FINALE COMPLÈTE
✅ Tous les modèles existants
✅ UserDocument intégré pour l'upload et analyse IA
✅ + KYCRequest intégré (User <-> Admin)
⚠️  SUPPORT retiré (maintenant dans support/models.py)
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal


# ============================================
# ANCIEN MODÈLE (garde pour compatibilité)
# ============================================

class CreditScore(models.Model):
    """
    Score de crédit principal (ANCIEN MODÈLE)
    Gardé pour compatibilité avec l'ancien code
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="credit_scores"
    )
    score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.score}"


class ScoreHistory(models.Model):
    """
    Historique détaillé des scores TERAS (ANCIEN MODÈLE)
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="score_history"
    )
    score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.score} - {self.created_at}"


# ============================================
# NOUVEAU MODÈLE TERAS COMPLET
# ============================================

class TerasScore(models.Model):
    """
    Score TERAS complet avec breakdown des 5 piliers
    Version 2.0 du système de scoring
    """
    # Relations
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teras_scores"
    )

    # Score global (0-1000)
    score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        help_text="Score TERAS global (0-1000 points)"
    )

    # Niveau calculé
    LEVEL_CHOICES = [
        ('debutant', 'Débutant'),
        ('bronze', 'Bronze'),
        ('argent', 'Argent'),
        ('or', 'Or'),
        ('diamant', 'Diamant'),
    ]
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='debutant'
    )

    # ============================================
    # BREAKDOWN DES 5 PILIERS (0-100 chacun)
    # ============================================

    # T - Transactions
    transactions_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score Transactions (0-100)"
    )

    # E - Épargne
    savings_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score Épargne (0-100)"
    )

    # R - Revenus
    income_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score Revenus (0-100)"
    )

    # A - Actifs
    assets_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score Actifs (0-100)"
    )

    # S - Social/Stabilité
    social_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score Social/Stabilité (0-100)"
    )

    # ============================================
    # MÉTADONNÉES DE CALCUL
    # ============================================

    # Pondérations utilisées (TERAS Basic par défaut)
    weight_t = models.FloatField(default=0.28, help_text="Poids Transactions")
    weight_e = models.FloatField(default=0.18, help_text="Poids Épargne")
    weight_r = models.FloatField(default=0.22, help_text="Poids Revenus")
    weight_a = models.FloatField(default=0.20, help_text="Poids Actifs")
    weight_s = models.FloatField(default=0.12, help_text="Poids Social")

    # Raison du score (pour explainability)
    reason_codes = models.JSONField(
        default=list,
        blank=True,
        help_text="Codes de raison expliquant le score (SHAP)"
    )

    # Version du modèle de calcul
    model_version = models.CharField(
        max_length=50,
        default='teras-basic-1.0',
        help_text="Version de l'algorithme utilisé"
    )

    # ✅ Source du score (simulé vs réel)
    SOURCE_CHOICES = [
        ('simulation', 'Simulation'),
        ('computed', 'Calcul manuel'),
        ('document', 'Analyse document'),
        ('api', 'API externe'),
        ('system', 'Système'),
    ]
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='system',
        help_text="Source du calcul de score"
    )

    # ✅ Flag simulation
    is_simulated = models.BooleanField(
        default=False,
        help_text="True si le score est une simulation"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Score TERAS"
        verbose_name_plural = "Scores TERAS"
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['score']),
            models.Index(fields=['level']),
            models.Index(fields=['is_simulated']),
        ]

    def __str__(self):
        sim = " (Sim)" if self.is_simulated else ""
        return f"{self.user.email} - {self.score}{sim} ({self.level})"

    def save(self, *args, **kwargs):
        """Calcule automatiquement le niveau avant sauvegarde"""
        self.level = self.calculate_level()
        super().save(*args, **kwargs)

    def calculate_level(self) -> str:
        """Calcule le niveau selon le score"""
        if self.score >= 900:
            return 'diamant'
        elif self.score >= 750:
            return 'or'
        elif self.score >= 600:
            return 'argent'
        elif self.score >= 400:
            return 'bronze'
        else:
            return 'debutant'

    @property
    def breakdown(self) -> dict:
        """Retourne le breakdown formaté"""
        return {
            'T': self.transactions_score,
            'E': self.savings_score,
            'R': self.income_score,
            'A': self.assets_score,
            'S': self.social_score,
        }

    @property
    def level_display(self) -> str:
        """Retourne le niveau en français capitalisé"""
        return self.get_level_display()


# ============================================
# MODÈLES COMPLÉMENTAIRES
# ============================================

class Transaction(models.Model):
    """
    Transactions pour le calcul du pilier T
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=[('credit', 'Crédit'), ('debit', 'Débit')],
        default='credit'
    )
    channel = models.CharField(
        max_length=50,
        default='mobile_money'
    )
    description = models.TextField(
        blank=True,
        default=''
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.amount} - {self.transaction_type}"


class Income(models.Model):
    """
    Revenus pour le calcul du pilier R
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="incomes"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    source = models.CharField(
        max_length=100,
        default='Autre'
    )
    is_recurring = models.BooleanField(
        default=False,
        help_text="Revenu récurrent (salaire, rente, etc.)"
    )
    verified = models.BooleanField(
        default=False,
        help_text="Revenu vérifié par documents"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.amount} - {self.source}"


class Asset(models.Model):
    """
    Actifs pour le calcul du pilier A
    """
    ASSET_TYPE_CHOICES = [
        ('immobilier', 'Immobilier'),
        ('vehicule', 'Véhicule'),
        ('terrain', 'Terrain'),
        ('equipement', 'Équipement professionnel'),
        ('epargne', 'Épargne/Investissement'),
        ('autre', 'Autre'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assets"
    )
    asset_type = models.CharField(
        max_length=50,
        choices=ASSET_TYPE_CHOICES
    )
    description = models.TextField(
        blank=True,
        default=''
    )
    estimated_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    verified = models.BooleanField(
        default=False,
        help_text="Actif vérifié par documents"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Actif"
        verbose_name_plural = "Actifs"

    def __str__(self):
        return f"{self.user.email} - {self.get_asset_type_display()} - {self.estimated_value}"


class SocialReputation(models.Model):
    """
    Réputation sociale pour le pilier S
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_reputation"
    )
    rating = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="Note moyenne (0-5 étoiles)"
    )
    reviews_count = models.IntegerField(
        default=0,
        help_text="Nombre d'avis reçus"
    )
    positive_feedbacks = models.IntegerField(
        default=0,
        help_text="Nombre de retours positifs"
    )
    negative_feedbacks = models.IntegerField(
        default=0,
        help_text="Nombre de retours négatifs"
    )
    community_participation = models.IntegerField(
        default=0,
        help_text="Score de participation communautaire (0-100)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Réputation Sociale"
        verbose_name_plural = "Réputations Sociales"

    def __str__(self):
        return f"{self.user.email} - Note: {self.rating}/5 ({self.reviews_count} avis)"


class Recommendation(models.Model):
    """
    Recommandations personnalisées pour améliorer le score TERAS
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommendations"
    )
    category = models.CharField(
        max_length=20,
        choices=[
            ('transactions', 'Transactions'),
            ('epargne', 'Épargne'),
            ('revenus', 'Revenus'),
            ('actifs', 'Actifs'),
            ('social', 'Social'),
        ],
        default='transactions'
    )
    priority = models.CharField(
        max_length=10,
        choices=[('high', 'Haute'), ('medium', 'Moyenne'), ('low', 'Basse')],
        default='medium'
    )
    title = models.CharField(
        max_length=200,
        default='Recommandation'
    )
    description = models.TextField(
        blank=True,
        default=''
    )
    impact = models.CharField(
        max_length=50,
        default='+0 points',
        help_text="Ex: +15 points"
    )
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-priority", "-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.title}"


# ============================================
# ✅ UPLOAD DE DOCUMENTS & ANALYSE IA
# ============================================

class UserDocument(models.Model):
    """
    Documents uploadés par les utilisateurs
    Avec analyse IA et extraction de données
    """
    STATUS_CHOICES = [
        ('uploaded', 'Uploadé'),
        ('processing', "En cours d'analyse"),
        ('parsed', 'Analysé'),
        ('failed', 'Échec'),
    ]

    CATEGORY_CHOICES = [
        ('general', 'Général'),
        ('bank_statement', 'Relevé bancaire'),
        ('payslip', 'Fiche de paie'),
        ('invoice', 'Facture'),
        ('proof_asset', "Justificatif d'actif"),
        ('identity', "Pièce d'identité"),
        ('tax_document', 'Document fiscal'),
        ('other', 'Autre'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_documents'
    )

    file = models.FileField(
        upload_to='user_documents/%Y/%m/',
        max_length=500
    )

    filename = models.CharField(
        max_length=255,
        help_text="Nom original du fichier"
    )

    file_size = models.IntegerField(
        default=0,
        help_text="Taille en octets"
    )

    mime_type = models.CharField(
        max_length=100,
        default='application/octet-stream',
        help_text="Type MIME du fichier"
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='uploaded'
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='general'
    )

    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Tags pour classification automatique"
    )

    extracted_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Données extraites : transactions, revenus, actifs, etc."
    )

    ai_analysis = models.JSONField(
        default=dict,
        blank=True,
        help_text="Analyse IA : insights, recommandations, impact score"
    )

    confidence = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Confiance de l'analyse IA (0-1)"
    )

    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date de fin de traitement IA"
    )

    error_message = models.TextField(
        blank=True,
        default='',
        help_text="Message d'erreur en cas d'échec"
    )

    generated_score = models.ForeignKey(
        'TerasScore',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_documents',
        help_text="Score TERAS généré à partir de ce document"
    )

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Document utilisateur"
        verbose_name_plural = "Documents utilisateur"
        indexes = [
            models.Index(fields=['user', '-uploaded_at']),
            models.Index(fields=['status']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.filename} ({self.user.email}) - {self.status}"

    @property
    def file_extension(self) -> str:
        if '.' in self.filename:
            return self.filename.rsplit('.', 1)[-1].lower()
        return ''

    @property
    def is_analyzed(self) -> bool:
        return self.status == 'parsed' and bool(self.extracted_data or self.ai_analysis)

    @property
    def is_image(self) -> bool:
        return self.file_extension in ['jpg', 'jpeg', 'png', 'gif', 'webp']

    @property
    def is_pdf(self) -> bool:
        return self.file_extension == 'pdf'

    @property
    def is_spreadsheet(self) -> bool:
        return self.file_extension in ['xlsx', 'xls', 'csv', 'ods']

    def get_score_impact(self) -> dict:
        if self.ai_analysis and 'score_impact' in self.ai_analysis:
            return self.ai_analysis['score_impact']
        return {
            'estimated_change': 0,
            'pillars_affected': [],
            'confidence': 0
        }


# ============================================
# ✅ MODÈLE KYC (Know Your Customer)
# ============================================

class KYCRequest(models.Model):
    """
    Demande de vérification KYC d'un utilisateur
    Soumise par l'utilisateur, validée par admin
    """

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_APPROVED, 'Approuvée'),
        (STATUS_REJECTED, 'Rejetée'),
    ]

    DOC_ID_CARD = 'id_card'
    DOC_PASSPORT = 'passport'
    DOC_RESIDENCE_PERMIT = 'residence_permit'
    DOC_UTILITY_BILL = 'utility_bill'
    DOC_BANK_STATEMENT = 'bank_statement'
    DOC_DRIVER_LICENSE = 'driver_license'
    DOC_OTHER = 'other'

    DOCUMENT_CHOICES = [
        (DOC_ID_CARD, "Carte d'identité"),
        (DOC_PASSPORT, "Passeport"),
        (DOC_RESIDENCE_PERMIT, "Titre de séjour"),
        (DOC_UTILITY_BILL, "Facture de services publics"),
        (DOC_BANK_STATEMENT, "Relevé bancaire"),
        (DOC_DRIVER_LICENSE, "Permis de conduire"),
        (DOC_OTHER, "Autre"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="kyc_requests"
    )

    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_CHOICES,
        default=DOC_ID_CARD
    )

    # Upload => media/kyc/...
    document_file = models.FileField(upload_to="kyc/")

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    rejection_reason = models.CharField(max_length=255, null=True, blank=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="kyc_reviews"
    )

    class Meta:
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["status", "submitted_at"]),
            models.Index(fields=["user", "submitted_at"]),
        ]

    def __str__(self):
        return f"KYCRequest(id={self.id}, user={self.user_id}, status={self.status})"

    def approve(self, reviewer):
        """Helper safe : approuver la demande"""
        self.status = self.STATUS_APPROVED
        self.reviewed_at = timezone.now()
        self.rejection_reason = ""
        self.reviewed_by = reviewer
        self.save(update_fields=["status", "reviewed_at", "rejection_reason", "reviewed_by"])

    def reject(self, reviewer, reason: str):
        """Helper safe : rejeter la demande"""
        self.status = self.STATUS_REJECTED
        self.reviewed_at = timezone.now()
        self.rejection_reason = (reason or "").strip()[:255]
        self.reviewed_by = reviewer
        self.save(update_fields=["status", "reviewed_at", "rejection_reason", "reviewed_by"])


# ============================================
# NOTE: Modèles SupportTicket et TicketMessage
# sont maintenant dans support/models.py
# Utilisez: from support.models import SupportTicket, TicketMessage
# ============================================


# ✅ Government models — ajout pour migrations
from .models_government import Region, Sector, Alert, GovernmentReport, GovernmentSettings, ActivityLog

# ✅ Enterprise models — ajout pour migrations
from .models_enterprise import EnterpriseClient, Employee, EnterpriseDocument, ComplianceStatus, EnterpriseReport, \
    EnterpriseScore

# ✅ Re-export BankEnterprise pour les références croisées
from .models_bank import BankEnterprise as BankEnterprise



# ✅ Linked Accounts + Staff system
from .models_linked_accounts import (
    LinkedAccount, ImportedTransaction,
    StaffMember, StaffActivityLog,
)
