# backend/scoring/models_linked_accounts.py
"""
TERAS — Comptes liés (Mobile Money, Banque) + Système Staff multi-interface
"""
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator


# ═══════════════════════════════════════════════════════════════════════════════
# COMPTES MOBILE MONEY / BANCAIRES LIÉS
# ═══════════════════════════════════════════════════════════════════════════════

class LinkedAccount(models.Model):
    """
    Compte Mobile Money ou bancaire lié à un utilisateur TERAS.
    Permet l'import automatique des transactions et du solde.
    """

    OPERATOR_CHOICES = [
        ('airtel_money',  'Airtel Money'),
        ('mtn_money',     'MTN Money'),
        ('zola',          'ZOLA (Portefeuille digital)'),
        ('orange_money',  'Orange Money'),
        ('bank_account',  'Compte Bancaire'),
        ('other',         'Autre'),
    ]

    ACCOUNT_TYPE_CHOICES = [
        ('mobile_money',  'Mobile Money'),
        ('bank_account',  'Compte Bancaire'),
        ('wallet',        'Portefeuille Digital'),
    ]

    STATUS_CHOICES = [
        ('pending',    'En attente de vérification'),
        ('verified',   'Vérifié'),
        ('failed',     'Échec de vérification'),
        ('syncing',    'Synchronisation en cours'),
        ('synced',     'Synchronisé'),
    ]

    user          = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='linked_accounts',
        verbose_name="Utilisateur",
    )
    operator      = models.CharField(
        max_length=30, choices=OPERATOR_CHOICES, verbose_name="Opérateur"
    )
    account_type  = models.CharField(
        max_length=20, choices=ACCOUNT_TYPE_CHOICES,
        default='mobile_money', verbose_name="Type de compte"
    )
    # Numéro de téléphone ou IBAN/numéro de compte
    phone_number  = models.CharField(
        max_length=20, blank=True, null=True,
        verbose_name="Numéro de téléphone",
        validators=[RegexValidator(r'^\+?[\d\s\-]{8,20}$', 'Numéro invalide')]
    )
    account_number = models.CharField(
        max_length=50, blank=True, null=True,
        verbose_name="Numéro de compte bancaire (IBAN)"
    )
    account_name  = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Nom du titulaire du compte"
    )
    bank_name     = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="Nom de la banque"
    )

    # Statut et vérification
    status        = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='pending', verbose_name="Statut"
    )
    is_primary    = models.BooleanField(
        default=False, verbose_name="Compte principal"
    )
    is_verified   = models.BooleanField(
        default=False, verbose_name="Vérifié"
    )
    verification_code = models.CharField(
        max_length=10, blank=True, null=True,
        verbose_name="Code de vérification OTP"
    )

    # Données financières (mises à jour lors de la sync)
    balance_xaf   = models.DecimalField(
        max_digits=15, decimal_places=2,
        default=0, verbose_name="Solde (FCFA)"
    )
    last_sync_at  = models.DateTimeField(
        null=True, blank=True, verbose_name="Dernière synchronisation"
    )
    transactions_imported = models.IntegerField(
        default=0, verbose_name="Transactions importées"
    )

    # Consentement
    consent_given = models.BooleanField(
        default=False, verbose_name="Consentement accès données donné"
    )
    consent_at    = models.DateTimeField(
        null=True, blank=True, verbose_name="Date du consentement"
    )

    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name         = "Compte lié"
        verbose_name_plural  = "Comptes liés"
        unique_together      = [['user', 'operator', 'phone_number']]
        ordering             = ['-is_primary', '-created_at']

    def __str__(self):
        identifier = self.phone_number or self.account_number or '—'
        return f"{self.get_operator_display()} — {identifier} ({self.user.email})"

    def save(self, *args, **kwargs):
        # Un seul compte principal par utilisateur
        if self.is_primary:
            LinkedAccount.objects.filter(
                user=self.user, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class ImportedTransaction(models.Model):
    """Transaction importée depuis un compte Mobile Money ou bancaire."""

    TYPE_CHOICES = [
        ('credit', 'Crédit (entrée)'),
        ('debit',  'Débit (sortie)'),
    ]

    linked_account = models.ForeignKey(
        LinkedAccount, on_delete=models.CASCADE,
        related_name='imported_transactions',
        verbose_name="Compte source"
    )
    external_id    = models.CharField(
        max_length=100, blank=True, null=True,
        verbose_name="ID externe (opérateur)"
    )
    date           = models.DateField(verbose_name="Date")
    description    = models.CharField(max_length=255, verbose_name="Description")
    amount         = models.DecimalField(
        max_digits=15, decimal_places=2, verbose_name="Montant (FCFA)"
    )
    tx_type        = models.CharField(
        max_length=10, choices=TYPE_CHOICES, verbose_name="Type"
    )
    balance_after  = models.DecimalField(
        max_digits=15, decimal_places=2,
        null=True, blank=True, verbose_name="Solde après transaction"
    )
    category       = models.CharField(
        max_length=50, blank=True, null=True,
        verbose_name="Catégorie (salaire, loyer, tontine...)"
    )
    is_income      = models.BooleanField(default=False)
    applied_to_teras = models.BooleanField(
        default=False, verbose_name="Appliqué au score TERAS"
    )
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Transaction importée"
        verbose_name_plural = "Transactions importées"
        unique_together     = [['linked_account', 'external_id']]
        ordering            = ['-date', '-created_at']

    def __str__(self):
        return f"{self.date} | {self.tx_type} | {self.amount} FCFA | {self.description[:30]}"


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTÈME STAFF MULTI-INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

class StaffMember(models.Model):
    """
    Membre d'équipe d'une institution (Banque, Entreprise, Gouvernement).
    Définit les droits d'accès au sein de l'interface TERAS de l'institution.
    """

    INTERFACE_CHOICES = [
        ('bank',        'Interface Banque'),
        ('enterprise',  'Interface Entreprise'),
        ('government',  'Interface Gouvernement'),
    ]

    # Rôles par interface
    ROLE_CHOICES_BANK = [
        ('bank_admin',   'Administrateur Banque'),
        ('bank_analyst', 'Analyste Crédit'),
        ('bank_agent',   'Agent Commercial'),
        ('bank_viewer',  'Lecture seule'),
    ]
    ROLE_CHOICES_ENTERPRISE = [
        ('ent_admin',    'Administrateur'),
        ('ent_manager',  'Manager'),
        ('ent_accountant','Comptable'),
        ('ent_hr',       'Ressources Humaines'),
        ('ent_viewer',   'Lecture seule'),
    ]
    ROLE_CHOICES_GOVERNMENT = [
        ('gov_admin',    'Administrateur'),
        ('gov_minister', 'Ministre / Directeur'),
        ('gov_analyst',  'Analyste'),
        ('gov_viewer',   'Lecture seule'),
    ]

    ALL_ROLES = (
        ROLE_CHOICES_BANK +
        ROLE_CHOICES_ENTERPRISE +
        ROLE_CHOICES_GOVERNMENT
    )

    STATUS_CHOICES = [
        ('active',    'Actif'),
        ('inactive',  'Inactif'),
        ('pending',   'Invitation en attente'),
        ('suspended', 'Suspendu'),
    ]

    # Institution (propriétaire du compte institution)
    institution_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_members',
        verbose_name="Institution (compte principal)",
    )
    # Membre de l'équipe (peut avoir un compte TERAS ou non)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='staff_memberships',
        verbose_name="Utilisateur TERAS",
    )
    # Invitation par email si pas de compte TERAS
    email = models.EmailField(verbose_name="Email du membre")
    first_name = models.CharField(max_length=100, blank=True, verbose_name="Prénom")
    last_name  = models.CharField(max_length=100, blank=True, verbose_name="Nom")
    phone      = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")

    interface  = models.CharField(
        max_length=20, choices=INTERFACE_CHOICES,
        verbose_name="Interface concernée"
    )
    role = models.CharField(
        max_length=30, choices=ALL_ROLES,
        verbose_name="Rôle"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES,
        default='pending', verbose_name="Statut"
    )

    # ── Permissions granulaires ──────────────────────────────────────────────
    # Stockées en JSON pour flexibilité totale
    permissions = models.JSONField(
        default=dict, blank=True,
        verbose_name="Permissions spécifiques",
        help_text="""
        Exemple:
        {
          "can_approve_loans": true,
          "can_view_clients": true,
          "can_create_clients": true,
          "can_edit_clients": false,
          "can_delete_clients": false,
          "can_view_analytics": true,
          "can_export_data": false,
          "can_manage_team": false,
          "can_view_documents": true,
          "can_upload_documents": true,
          "max_loan_amount": 5000000,
          "allowed_regions": ["Brazzaville", "Pointe-Noire"]
        }
        """
    )

    # Métadonnées
    invited_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='staff_invitations_sent',
        verbose_name="Invité par"
    )
    invite_token = models.CharField(
        max_length=64, blank=True, null=True,
        verbose_name="Token d'invitation"
    )
    invite_expires_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Expiration invitation"
    )
    joined_at   = models.DateTimeField(
        null=True, blank=True, verbose_name="Date d'acceptation"
    )
    last_active_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Dernière activité"
    )

    notes       = models.TextField(blank=True, verbose_name="Notes internes")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Membre du personnel"
        verbose_name_plural = "Membres du personnel"
        unique_together     = [['institution_user', 'email', 'interface']]
        ordering            = ['role', 'last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_role_display()}) — {self.institution_user.email}"

    @property
    def full_name(self):
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}".strip() or self.email
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def has_permission(self, perm: str) -> bool:
        """Vérifie si le membre a une permission spécifique."""
        # Admin a tout
        if self.role in ('bank_admin', 'ent_admin', 'gov_admin'):
            return True
        return bool(self.permissions.get(perm, False))

    def get_default_permissions(self) -> dict:
        """Retourne les permissions par défaut selon le rôle."""
        BASE = {
            'can_view_clients':     False,
            'can_create_clients':   False,
            'can_edit_clients':     False,
            'can_delete_clients':   False,
            'can_approve_loans':    False,
            'can_reject_loans':     False,
            'can_view_analytics':   False,
            'can_export_data':      False,
            'can_manage_team':      False,
            'can_view_documents':   False,
            'can_upload_documents': False,
            'can_view_reports':     False,
            'can_generate_reports': False,
            'max_loan_amount':      0,
        }
        PRESETS = {
            # Banque
            'bank_admin':   {**BASE, 'can_view_clients': True, 'can_create_clients': True,
                             'can_edit_clients': True, 'can_approve_loans': True,
                             'can_reject_loans': True, 'can_view_analytics': True,
                             'can_export_data': True, 'can_manage_team': True,
                             'can_view_documents': True, 'can_upload_documents': True,
                             'can_view_reports': True, 'can_generate_reports': True,
                             'max_loan_amount': 50_000_000},
            'bank_analyst': {**BASE, 'can_view_clients': True, 'can_view_analytics': True,
                             'can_view_documents': True, 'can_view_reports': True,
                             'max_loan_amount': 5_000_000},
            'bank_agent':   {**BASE, 'can_view_clients': True, 'can_create_clients': True,
                             'can_view_documents': True, 'can_upload_documents': True,
                             'max_loan_amount': 1_000_000},
            'bank_viewer':  {**BASE, 'can_view_clients': True, 'can_view_analytics': True},
            # Entreprise
            'ent_admin':    {**BASE, 'can_view_clients': True, 'can_create_clients': True,
                             'can_edit_clients': True, 'can_view_analytics': True,
                             'can_export_data': True, 'can_manage_team': True,
                             'can_view_documents': True, 'can_upload_documents': True,
                             'can_view_reports': True, 'can_generate_reports': True},
            'ent_manager':  {**BASE, 'can_view_clients': True, 'can_create_clients': True,
                             'can_view_analytics': True, 'can_view_documents': True,
                             'can_view_reports': True},
            'ent_accountant':{**BASE, 'can_view_analytics': True, 'can_export_data': True,
                              'can_view_reports': True, 'can_generate_reports': True},
            'ent_hr':       {**BASE, 'can_view_clients': True, 'can_create_clients': True},
            'ent_viewer':   {**BASE, 'can_view_clients': True},
            # Gouvernement
            'gov_admin':    {**BASE, 'can_view_analytics': True, 'can_export_data': True,
                             'can_manage_team': True, 'can_view_reports': True,
                             'can_generate_reports': True, 'can_view_documents': True,
                             'can_upload_documents': True},
            'gov_minister': {**BASE, 'can_view_analytics': True, 'can_view_reports': True,
                             'can_generate_reports': True},
            'gov_analyst':  {**BASE, 'can_view_analytics': True, 'can_view_reports': True},
            'gov_viewer':   {**BASE, 'can_view_analytics': True},
        }
        return PRESETS.get(self.role, BASE)


class StaffActivityLog(models.Model):
    """Journal des actions effectuées par un membre du staff."""

    staff_member = models.ForeignKey(
        StaffMember, on_delete=models.CASCADE,
        related_name='activity_logs',
        verbose_name="Membre du staff"
    )
    action       = models.CharField(max_length=200, verbose_name="Action")
    resource     = models.CharField(max_length=100, blank=True, verbose_name="Ressource concernée")
    resource_id  = models.CharField(max_length=50, blank=True, verbose_name="ID ressource")
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    details      = models.JSONField(default=dict, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Log d'activité staff"
        verbose_name_plural = "Logs d'activité staff"
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.staff_member.full_name} — {self.action} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"
