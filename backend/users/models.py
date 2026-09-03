# users/models.py - VERSION ÉTENDUE AVEC VALIDATION DOCUMENTS & LÉGISLATION

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.utils import timezone

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    """
    Modèle utilisateur personnalisé pour TERAS
    Types : individual, admin, enterprise, government, bank
    """

    USER_TYPE_CHOICES = (
        ("individual", "Individuel"),
        ("admin", "Administrateur"),
        ("enterprise", "Entreprise"),
        ("government", "Gouvernement"),
        ("bank", "Banque"),
    )

    # KYC Status
    KYC_STATUS_CHOICES = (
        ('not_started', 'Non commencé'),
        ('pending', 'En attente'),
        ('incomplete', 'Incomplet'),
        ('under_review', 'En cours de vérification'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    )

    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default="individual",
        verbose_name="Type de compte",
    )

    email = models.EmailField(
        unique=True,
        verbose_name="Email",
    )

    # ✅ NOUVEAU : KYC Status
    kyc_status = models.CharField(
        max_length=20,
        choices=KYC_STATUS_CHOICES,
        default='not_started',
        verbose_name="Statut KYC"
    )
    kyc_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date vérification KYC"
    )
    kyc_verified_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_users',
        verbose_name="Vérifié par"
    )

    # ✅ NOUVEAU : Metadata régionale
    country = models.CharField(
        max_length=2,
        blank=True,
        null=True,
        verbose_name="Pays (code ISO)"
    )
    region = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Région/Département"
    )
    sector = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Secteur d'activité"
    )

    # ✅ NOUVEAU : Entreprise metadata
    company_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name="Nom de l'entreprise"
    )
    company_registration = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Numéro RCCM"
    )
    employee_count = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Nombre d'employés"
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"

    @property
    def role(self) -> str:
        """Retourne le role pour compatibilité backend"""
        mapping = {
            "individual": "USER_BASIC",
            "admin": "ADMIN",
            "enterprise": "ENTERPRISE",
            "government": "GOVERNMENT",
            "bank": "BANK",
        }
        return mapping.get(self.user_type, "USER_BASIC")

    @property
    def is_admin_user(self):
        return self.user_type == 'admin' or self.is_superuser

    @property
    def is_government_user(self):
        return self.user_type == 'government'

    @property
    def is_enterprise_user(self):
        return self.user_type == 'enterprise'

    @property
    def is_individual_user(self):
        return self.user_type == 'individual'

    @property
    def is_bank_user(self):
        return self.user_type == 'bank'

    @property
    def kyc_completion_percentage(self):
        """Calcule le % de complétion du KYC"""
        required_docs = self.get_required_document_types()
        if not required_docs:
            return 100
        
        approved_docs = Document.objects.filter(
            user=self,
            document_type__in=required_docs,
            status='approved'
        ).values_list('document_type', flat=True).distinct()
        
        return int((len(approved_docs) / len(required_docs)) * 100)

    def get_required_document_types(self):
        """Retourne les types de documents requis selon le type d'utilisateur"""
        if self.is_individual_user:
            return ['national_id', 'residence_proof', 'bank_statement']
        elif self.is_enterprise_user:
            return ['business_registration', 'business_statutes', 'tax_certificate', 'bank_statement']
        elif self.is_government_user:
            return ['official_mandate', 'accreditation']
        elif self.is_bank_user:
            return ['banking_license', 'certification']
        return []

    def can_apply_for_credit(self):
        """Vérifie si l'utilisateur peut demander un crédit"""
        return self.kyc_status == 'approved' and self.is_active

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username

    def get_short_name(self):
        return self.first_name or self.username


class Profile(models.Model):
    """Profil utilisateur étendu"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    bio = models.TextField(blank=True, null=True, verbose_name="Biographie")
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Téléphone")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Adresse")
    city = models.CharField(max_length=100, blank=True, null=True, verbose_name="Ville")
    country = models.CharField(max_length=2, blank=True, null=True, verbose_name="Pays (code ISO)")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, verbose_name="Latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, verbose_name="Longitude")
    location_source = models.CharField(max_length=30, blank=True, null=True, verbose_name="Source géolocalisation")
    location_updated_at = models.DateTimeField(blank=True, null=True, verbose_name="Dernière mise à jour géolocalisation")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"

    def __str__(self):
        return f"Profil de {self.user.email}"


# ============================================================
# ✅ NOUVEAU : SYSTÈME DE DOCUMENTS
# ============================================================

class Document(models.Model):
    """Documents uploadés pour validation KYC"""
    
    DOCUMENT_TYPES = [
        # Individual
        ('national_id', 'Carte Nationale d\'Identité'),
        ('passport', 'Passeport'),
        ('drivers_license', 'Permis de conduire'),
        ('residence_proof', 'Justificatif de domicile'),
        ('bank_statement', 'Relevé bancaire'),
        
        # Enterprise
        ('business_registration', 'RCCM'),
        ('business_statutes', 'Statuts'),
        ('tax_certificate', 'Certificat fiscal'),
        ('balance_sheet', 'Bilan comptable'),
        ('business_plan', 'Plan d\'affaires'),
        
        # Government
        ('official_mandate', 'Mandat officiel'),
        ('accreditation', 'Accréditation'),
        ('government_id', 'Badge gouvernemental'),
        
        # Bank
        ('banking_license', 'Licence bancaire'),
        ('certification', 'Certification'),
        ('audit_report', 'Rapport d\'audit'),
        
        # Autres
        ('other', 'Autre'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('under_review', 'En cours de vérification'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('flagged', 'Signalé'),
        ('expired', 'Expiré'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name="Utilisateur"
    )
    
    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPES,
        verbose_name="Type de document"
    )
    
    file = models.FileField(
        upload_to='documents/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])],
        verbose_name="Fichier"
    )
    
    filename = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Validation
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents'
    )
    
    # ✅ Flag si uploadé par admin
    uploaded_by_admin = models.BooleanField(default=False)
    admin_uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_uploaded_documents'
    )
    
    # IA Analysis
    ai_analyzed = models.BooleanField(default=False)
    ai_analyzed_at = models.DateTimeField(null=True, blank=True)
    ai_confidence_score = models.FloatField(
        null=True,
        blank=True,
        help_text="Score de confiance IA (0-100)"
    )
    ai_recommendation = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        choices=[
            ('approve', 'Approuver'),
            ('reject', 'Rejeter'),
            ('review', 'Réviser manuellement'),
            ('request_more', 'Demander plus d\'info'),
        ]
    )
    ai_analysis_json = models.JSONField(
        null=True,
        blank=True,
        help_text="Résultat complet de l'analyse IA"
    )
    
    # Extracted data (OCR + IA)
    extracted_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Données extraites du document"
    )
    
    # Admin notes
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Expiration
    expiry_date = models.DateField(null=True, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Document"
        verbose_name_plural = "Documents"
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_document_type_display()} ({self.status})"
    
    @property
    def is_expired(self):
        """Vérifie si le document est expiré"""
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return True
        return False
    
    def save(self, *args, **kwargs):
        if self.file:
            self.filename = self.file.name.split('/')[-1]
            self.file_size = self.file.size
        super().save(*args, **kwargs)


class ValidationDecision(models.Model):
    """Historique des décisions de validation"""
    
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='validation_history'
    )
    
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='validation_decisions'
    )
    
    decision = models.CharField(
        max_length=20,
        choices=[
            ('approve', 'Approuvé'),
            ('reject', 'Rejeté'),
            ('flag', 'Signalé'),
            ('request_more', 'Demander plus d\'info'),
        ]
    )
    
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    ai_assisted = models.BooleanField(default=False)
    ai_recommendation_followed = models.BooleanField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Décision de validation"
        verbose_name_plural = "Décisions de validation"
    
    def __str__(self):
        return f"{self.document} - {self.decision} par {self.admin}"


# ============================================================
# ✅ NOUVEAU : LÉGISLATION
# ============================================================

class LegislationDocument(models.Model):
    """Documents législatifs pour référence IA"""
    
    COUNTRIES = [
        ('CG', 'Congo-Brazzaville'),
        ('CM', 'Cameroun'),
        ('GA', 'Gabon'),
        ('TD', 'Tchad'),
        ('CF', 'Centrafrique'),
        ('GQ', 'Guinée Équatoriale'),
    ]
    
    CATEGORIES = [
        ('kyc', 'KYC/AML'),
        ('banking', 'Bancaire'),
        ('business', 'Droit des affaires'),
        ('tax', 'Fiscalité'),
        ('labor', 'Droit du travail'),
        ('compliance', 'Conformité'),
        ('other', 'Autre'),
    ]
    
    country = models.CharField(
        max_length=2,
        choices=COUNTRIES,
        verbose_name="Pays"
    )
    
    category = models.CharField(
        max_length=50,
        choices=CATEGORIES,
        verbose_name="Catégorie"
    )
    
    title = models.CharField(
        max_length=500,
        verbose_name="Titre"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Description"
    )
    
    file = models.FileField(
        upload_to='legislation/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
        verbose_name="Fichier PDF"
    )
    
    filename = models.CharField(max_length=255, blank=True)
    file_size = models.IntegerField(default=0)
    page_count = models.IntegerField(default=0)
    
    # Métadonnées
    upload_date = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_legislation'
    )
    
    effective_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date d'entrée en vigueur"
    )
    
    language = models.CharField(
        max_length=2,
        default='fr',
        verbose_name="Langue"
    )
    
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Tags"
    )
    
    # Indexation IA
    indexed = models.BooleanField(
        default=False,
        verbose_name="Indexé"
    )
    indexed_at = models.DateTimeField(null=True, blank=True)
    chunks_count = models.IntegerField(default=0)
    vector_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="IDs des vecteurs dans la base vectorielle"
    )
    
    # Stats utilisation
    referenced_count = models.IntegerField(
        default=0,
        verbose_name="Nombre de références"
    )
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Statut
    is_active = models.BooleanField(
        default=True,
        verbose_name="Actif"
    )
    
    class Meta:
        ordering = ['-upload_date']
        verbose_name = "Document législatif"
        verbose_name_plural = "Documents législatifs"
        indexes = [
            models.Index(fields=['country', 'category']),
            models.Index(fields=['indexed', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_country_display()} - {self.title}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.filename = self.file.name.split('/')[-1]
            self.file_size = self.file.size
        super().save(*args, **kwargs)
    
    def increment_reference_count(self):
        """Incrémente le compteur d'utilisation"""
        self.referenced_count += 1
        self.last_used = timezone.now()
        self.save(update_fields=['referenced_count', 'last_used'])


# ============================================================
# ✅ ANCIEN MODÈLE - Gardé pour compatibilité
# ============================================================

class UploadedDocument(models.Model):
    """Documents uploadés pour analyse TERAS (ancien modèle)"""
    
    CATEGORY_BANK = "bank"
    CATEGORY_PAYSLIP = "payslip"
    CATEGORY_OTHER = "other"

    CATEGORY_CHOICES = [
        (CATEGORY_BANK, "Relevé bancaire"),
        (CATEGORY_PAYSLIP, "Bulletin de salaire"),
        (CATEGORY_OTHER, "Autre"),
    ]

    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_PROCESSED = "processed"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "En attente"),
        (STATUS_PROCESSING, "En cours"),
        (STATUS_PROCESSED, "Traité"),
        (STATUS_FAILED, "Échec"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_documents",
        verbose_name="Utilisateur"
    )
    file = models.FileField(
        upload_to="user_documents/%Y/%m/%d/",
        verbose_name="Fichier"
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default=CATEGORY_OTHER,
        verbose_name="Catégorie"
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'upload"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        verbose_name="Statut"
    )
    analysis_summary = models.TextField(
        blank=True,
        verbose_name="Résumé de l'analyse"
    )

    class Meta:
        verbose_name = "Document uploadé"
        verbose_name_plural = "Documents uploadés"
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.user.email} - {self.get_category_display()} - {self.file.name}"

    @property
    def filename(self):
        return self.file.name.split('/')[-1] if self.file else ''


# ============================================================
# SIGNALS
# ============================================================

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """Crée automatiquement un profil lors de la création d'un utilisateur"""
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    """Sauvegarde le profil quand l'utilisateur est sauvegardé"""
    if hasattr(instance, "profile"):
        instance.profile.save()


@receiver(post_save, sender=Document)
def update_kyc_status_on_document_change(sender, instance, **kwargs):
    """Met à jour le statut KYC quand un document change"""
    user = instance.user
    
    # Compte les documents requis et approuvés
    required = user.get_required_document_types()
    approved = Document.objects.filter(
        user=user,
        document_type__in=required,
        status='approved'
    ).values_list('document_type', flat=True).distinct()
    
    # Met à jour le statut KYC
    if len(approved) == len(required):
        user.kyc_status = 'approved'
        user.kyc_verified_at = timezone.now()
    elif len(approved) > 0:
        user.kyc_status = 'incomplete'
    elif Document.objects.filter(user=user, status='pending').exists():
        user.kyc_status = 'pending'
    
    user.save(update_fields=['kyc_status', 'kyc_verified_at'])


# ============================================================
# ✅ NOUVEAU : USER SETTINGS
# ============================================================

class UserSettings(models.Model):
    """
    Paramètres utilisateur personnalisés
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='settings',
        verbose_name="Utilisateur"
    )
    
    # Notifications
    notifications_score = models.BooleanField(
        default=True,
        verbose_name="Alertes de score"
    )
    notifications_recommendations = models.BooleanField(
        default=True,
        verbose_name="Recommandations"
    )
    notifications_documents = models.BooleanField(
        default=True,
        verbose_name="Documents requis"
    )
    
    # Confidentialité
    two_factor_auth = models.BooleanField(
        default=False,
        verbose_name="Authentification à deux facteurs"
    )
    data_sharing = models.BooleanField(
        default=False,
        verbose_name="Partage de données anonyme"
    )
    
    # Apparence
    THEME_CHOICES = [
        ('dark', 'Sombre'),
        ('light', 'Clair'),
        ('auto', 'Automatique'),
    ]
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='dark',
        verbose_name="Thème"
    )
    
    # Langue et région
    LANGUAGE_CHOICES = [
        ('fr', 'Français'),
        ('en', 'English'),
    ]
    language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default='fr',
        verbose_name="Langue"
    )
    
    CURRENCY_CHOICES = [
        ('XAF', 'FCFA (XAF)'),
        ('EUR', 'EUR (€)'),
        ('USD', 'USD ($)'),
    ]
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='XAF',
        verbose_name="Devise"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Paramètres utilisateur"
        verbose_name_plural = "Paramètres utilisateurs"
        db_table = 'user_settings'
    
    def __str__(self):
        return f"Settings for {self.user.email}"
