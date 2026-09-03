# backend/scoring/models_bank.py
"""
Modèles Django pour l'interface Bank TERAS
Contexte : Congo Brazzaville (CG) — NIU, FCFA, OHADA
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
from uuid import uuid4

User = get_user_model()


class BankClient(models.Model):
    """Clients particuliers de la banque — Congo Brazzaville"""
    CLIENT_STATUS_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('suspended', 'Suspendu'),
    ]

    # Informations personnelles
    first_name = models.CharField(max_length=100, verbose_name="Prénom")
    last_name  = models.CharField(max_length=100, verbose_name="Nom")
    email      = models.EmailField(unique=True)
    phone      = models.CharField(max_length=20)
    date_of_birth = models.DateField(verbose_name="Date de naissance")

    # Identité Congo Brazzaville
    # NIU = Numéro d'Identification Universel (remplace CNI en RCB)
    niu = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="NIU (Numéro d'Identification Universel)",
        help_text="Identifiant unique du citoyen congolais"
    )
    # Alias pour compatibilité avec le code existant
    national_id = property(lambda self: self.niu)

    # Adresse
    address = models.CharField(max_length=255)
    city    = models.CharField(max_length=100, default="Brazzaville")
    country = models.CharField(max_length=2, default='CG')  # Congo Brazzaville

    # Informations professionnelles
    occupation     = models.CharField(max_length=100, blank=True)
    monthly_income = models.DecimalField(max_digits=15, decimal_places=2, default=0,
                                         verbose_name="Revenus mensuels (FCFA)")

    # Score TERAS
    teras_score = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1000)]
    )
    teras_band = models.CharField(max_length=5, blank=True)

    # Crédits
    active_loans_count = models.IntegerField(default=0)
    total_borrowed     = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    bank_owner = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='owned_bank_clients',
        limit_choices_to={'user_type': 'bank'},
        help_text="Compte banque propriétaire de ce client portefeuille"
    )

    # Statut
    status    = models.CharField(max_length=20, choices=CLIENT_STATUS_CHOICES, default='active')
    join_date = models.DateField(auto_now_add=True)

    # Compte TERAS auto-créé
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='bank_profile'
    )
    teras_account_email    = models.EmailField(blank=True, help_text="Email du compte TERAS auto-créé")
    teras_account_password = models.CharField(max_length=100, blank=True,
                                               help_text="Mot de passe initial (en clair pour remise au client)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_clients'
        ordering = ['-created_at']
        verbose_name = "Client Banque"

    def __str__(self):
        return f"{self.first_name} {self.last_name} — NIU: {self.niu}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def crm_limit(self):
        """CRM = 30% des revenus nets mensuels (protocole ZOLA)"""
        return round(float(self.monthly_income) * 0.30) if self.monthly_income else 0


class BankEnterprise(models.Model):
    """Clients entreprises de la banque — Congo Brazzaville"""
    ENTERPRISE_TYPE_CHOICES = [
        ('pme',              'PME'),
        ('grande_entreprise','Grande Entreprise'),
        ('startup',          'Startup'),
        ('association',      'Association/ONG'),
        ('cooperative',      'Coopérative'),
    ]
    STATUS_CHOICES = [
        ('active',    'Actif'),
        ('inactive',  'Inactif'),
        ('suspended', 'Suspendu'),
    ]

    name          = models.CharField(max_length=200, verbose_name="Nom commercial")
    legal_name    = models.CharField(max_length=200, verbose_name="Raison sociale")
    # RCCM = Registre du Commerce et du Crédit Mobilier (OHADA)
    registration_number = models.CharField(max_length=50, unique=True,
                                            verbose_name="N° RCCM",
                                            help_text="Registre du Commerce (OHADA)")
    # NIU entreprise
    tax_id = models.CharField(max_length=50, unique=True,
                               verbose_name="NIU Entreprise",
                               help_text="Numéro d'Identification Fiscale")
    enterprise_type = models.CharField(max_length=50, choices=ENTERPRISE_TYPE_CHOICES)
    sector          = models.CharField(max_length=100, blank=True, verbose_name="Secteur d'activité")

    # Contact
    email   = models.EmailField(unique=True)
    phone   = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    city    = models.CharField(max_length=100, default="Brazzaville")
    country = models.CharField(max_length=2, default='CG')

    # Financier
    annual_revenue  = models.DecimalField(max_digits=15, decimal_places=2, default=0,
                                          verbose_name="CA annuel (FCFA)")
    employees_count = models.IntegerField(default=0)

    # Score TERAS
    teras_score = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1000)]
    )
    teras_band = models.CharField(max_length=5, blank=True)

    # Crédits
    active_loans_count = models.IntegerField(default=0)
    total_borrowed     = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    bank_owner = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='owned_bank_enterprises',
        limit_choices_to={'user_type': 'bank'},
        help_text="Compte banque propriétaire de cette entreprise portefeuille"
    )

    status    = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    join_date = models.DateField(auto_now_add=True)

    # Compte TERAS auto-créé
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='bank_enterprise_profile'
    )
    teras_account_email    = models.EmailField(blank=True)
    teras_account_password = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_enterprises'
        ordering = ['-created_at']
        verbose_name = "Entreprise Banque"

    def __str__(self):
        return f"{self.name} — RCCM: {self.registration_number}"

    @property
    def monthly_income(self):
        """Revenus mensuels estimés depuis CA annuel"""
        return self.annual_revenue / 12 if self.annual_revenue else Decimal('0')

    @property
    def crm_limit(self):
        return round(float(self.monthly_income) * 0.30)


class FinancialProduct(models.Model):
    """Produits financiers — gamme complète CEMAC/Congo"""
    PRODUCT_TYPE_CHOICES = [
        ('microcredit',  'Microcrédit / Tontine'),
        ('personal',     'Crédit Personnel'),
        ('salary',       'Avance sur Salaire'),
        ('auto',         'Crédit Auto'),
        ('immobilier',   'Crédit Immobilier'),
        ('pme',          'Crédit PME'),
        ('agricole',     'Crédit Agricole'),
        ('education',    'Crédit Éducation'),
        ('epargne',      'Épargne Bloquée'),
        ('other',        'Autre'),
    ]

    RISK_LEVEL_CHOICES = [
        ('low',    'Faible'),
        ('medium', 'Moyen'),
        ('high',   'Élevé'),
    ]

    name         = models.CharField(max_length=200)
    product_type = models.CharField(max_length=50, choices=PRODUCT_TYPE_CHOICES)
    description  = models.TextField()
    features     = models.JSONField(default=list, blank=True,
                                    help_text="Liste des caractéristiques clés")
    requirements = models.JSONField(default=list, blank=True,
                                    help_text="Documents/conditions requis")
    risk_level   = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES, default='medium')

    # Montants en FCFA
    min_amount = models.DecimalField(max_digits=15, decimal_places=2,
                                      verbose_name="Montant minimum (FCFA)")
    max_amount = models.DecimalField(max_digits=15, decimal_places=2,
                                      verbose_name="Montant maximum (FCFA)")

    # Durée
    min_duration_months = models.IntegerField(verbose_name="Durée min (mois)")
    max_duration_months = models.IntegerField(verbose_name="Durée max (mois)")

    # Taux
    interest_rate     = models.DecimalField(max_digits=5, decimal_places=2,
                                             verbose_name="Taux d'intérêt (%/an)")
    origination_fee   = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.50'),
                                             verbose_name="Frais de dossier (%)")

    # Éligibilité
    min_score_required = models.IntegerField(
        default=400, validators=[MinValueValidator(0), MaxValueValidator(1000)],
        verbose_name="Score TERAS minimum"
    )
    max_age    = models.IntegerField(default=65)
    min_income = models.DecimalField(max_digits=15, decimal_places=2, default=0,
                                      verbose_name="Revenu minimum (FCFA/mois)")

    # Statistiques
    total_disbursed    = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    applications_count = models.IntegerField(default=0)

    bank_owner = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='owned_bank_products',
        limit_choices_to={'user_type': 'bank'},
        help_text="Banque propriétaire du produit"
    )

    is_active  = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False, help_text="Produit standard pré-configuré")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_products'
        ordering = ['min_score_required', 'min_amount']
        verbose_name = "Produit Financier"

    def __str__(self):
        return f"{self.name} ({self.get_product_type_display()}) — {self.interest_rate}%"


class LoanApplication(models.Model):
    """Demandes de crédit"""
    STATUS_CHOICES = [
        ('pending',   'En attente'),
        ('review',    'En révision'),
        ('approved',  'Approuvé'),
        ('rejected',  'Rejeté'),
        ('disbursed', 'Décaissé'),
        ('cancelled', 'Annulé'),
    ]
    APPLICANT_TYPE_CHOICES = [
        ('individual', 'Particulier'),
        ('enterprise', 'Entreprise'),
    ]

    application_id = models.CharField(max_length=50, unique=True, editable=False)
    applicant_type = models.CharField(max_length=20, choices=APPLICANT_TYPE_CHOICES)
    client         = models.ForeignKey(BankClient,    on_delete=models.CASCADE, null=True, blank=True, related_name='applications')
    enterprise     = models.ForeignKey(BankEnterprise, on_delete=models.CASCADE, null=True, blank=True, related_name='applications')
    product        = models.ForeignKey(FinancialProduct, on_delete=models.PROTECT, related_name='applications')

    requested_amount  = models.DecimalField(max_digits=15, decimal_places=2)
    duration_months   = models.IntegerField()
    purpose           = models.TextField()

    monthly_payment   = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_repayment   = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    teras_score_at_application = models.IntegerField(null=True, blank=True)
    risk_level = models.CharField(max_length=20, blank=True)

    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by   = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    reviewed_at   = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    bank_owner = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='owned_loan_applications',
        limit_choices_to={'user_type': 'bank'},
        help_text="Banque responsable de cette demande"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'bank_applications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application_id} — {self.get_status_display()}"

    @staticmethod
    def generate_application_id():
        date_part = timezone.localdate().strftime('%Y%m%d')
        while True:
            candidate = f"APP-{date_part}-{uuid4().hex[:6].upper()}"
            if not LoanApplication.objects.filter(application_id=candidate).exists():
                return candidate

    def save(self, *args, **kwargs):
        if not self.bank_owner_id:
            for related_object in (self.client, self.enterprise, self.product):
                owner_id = getattr(related_object, 'bank_owner_id', None)
                if owner_id:
                    self.bank_owner_id = owner_id
                    break

        if not self.application_id:
            self.application_id = self.generate_application_id()

        if self.requested_amount and self.duration_months and self.product and (
            not self.monthly_payment or not self.total_repayment
        ):
            self.calculate_payments()

        super().save(*args, **kwargs)

    def calculate_payments(self):
        if self.requested_amount and self.duration_months and self.product:
            rate   = float(self.product.interest_rate) / 100 / 12
            n      = self.duration_months
            amount = float(self.requested_amount)
            if rate > 0:
                monthly = amount * (rate * (1 + rate)**n) / ((1 + rate)**n - 1)
            else:
                monthly = amount / n
            self.monthly_payment = Decimal(str(round(monthly, 2)))
            self.total_repayment = self.monthly_payment * n



class BankMessage(models.Model):
    """Messages envoyés par la banque au client via l'interface TERAS."""
    MESSAGE_TYPES = [
        ('info',     'Information'),
        ('offer',    'Offre commerciale'),
        ('reminder', 'Rappel échéance'),
        ('alert',    'Alerte compte'),
    ]

    recipient    = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='bank_messages',
        help_text="Utilisateur TERAS destinataire"
    )
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='info')
    subject      = models.CharField(max_length=255)
    body         = models.TextField()
    is_read      = models.BooleanField(default=False)
    sender_name  = models.CharField(max_length=100, default='TERAS Banque')
    related_application_id = models.CharField(max_length=50, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Message Banque"

    def __str__(self):
        return f"[{self.message_type}] {self.subject} → {self.recipient.email}"
