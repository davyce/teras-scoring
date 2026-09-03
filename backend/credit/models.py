# backend/credit/models.py
"""
TERAS Credit Models (CORRIGÉ)
Modèles pour le système de crédit ZOLA/TERAS
Intègre le scoring TERAS sur 1000 points et le protocole de crédit
"""

import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class CreditProduct(models.Model):
    """
    Produit de crédit ZOLA (SEED, STARTER, GROWTH, PRO)
    Correspond aux paliers du protocole ZOLA
    """

    CATEGORY_SEED = 'seed'
    CATEGORY_STARTER = 'starter'
    CATEGORY_GROWTH = 'growth'
    CATEGORY_PRO = 'pro'

    CATEGORY_CHOICES = [
        (CATEGORY_SEED, 'SEED - Test/Urgence (14-30j)'),
        (CATEGORY_STARTER, 'STARTER - Trésorerie (1-3 mois)'),
        (CATEGORY_GROWTH, 'GROWTH - Stock/Équipement (3-6 mois)'),
        (CATEGORY_PRO, 'PRO - Expansion (6-24 mois)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()

    # Éligibilité Score TERAS (sur 1000)
    min_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        help_text="Score TERAS minimum requis"
    )
    max_score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        default=1000,
        help_text="Score TERAS maximum (pour cibler une tranche)"
    )

    # Montants (en CDF)
    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Durées (en mois)
    min_duration_months = models.IntegerField(validators=[MinValueValidator(1)])
    max_duration_months = models.IntegerField(validators=[MinValueValidator(1)])

    # Taux d'intérêt annuel (%)
    interest_rate_min = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Taux minimum annuel (%)"
    )
    interest_rate_max = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Taux maximum annuel (%)"
    )

    # Garanties
    guarantees_required = models.BooleanField(default=False)
    requires_coempruntor = models.BooleanField(default=False, verbose_name="Co-emprunteur requis")
    requires_collateral = models.BooleanField(default=False, verbose_name="Gage matériel requis")

    # Conditions spécifiques
    conditions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Conditions additionnelles (JSON)"
    )

    # Métadonnées
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'display_order', 'name']
        verbose_name = "Produit de crédit"
        verbose_name_plural = "Produits de crédit"

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    def get_average_rate(self):
        """Taux moyen du produit"""
        return (self.interest_rate_min + self.interest_rate_max) / Decimal('2')


class CreditRequest(models.Model):
    """
    Demande de crédit d'un utilisateur
    Workflow: pending → under_review → approved/rejected → disbursed → active → completed/defaulted
    """

    STATUS_PENDING = 'pending'
    STATUS_UNDER_REVIEW = 'under_review'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DISBURSED = 'disbursed'
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'
    STATUS_DEFAULTED = 'defaulted'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_UNDER_REVIEW, 'En cours d\'examen'),
        (STATUS_APPROVED, 'Approuvé'),
        (STATUS_REJECTED, 'Rejeté'),
        (STATUS_ACCEPTED, 'Accepté par l\'utilisateur'),
        (STATUS_DISBURSED, 'Décaissé'),
        (STATUS_ACTIVE, 'Actif'),
        (STATUS_COMPLETED, 'Complété'),
        (STATUS_DEFAULTED, 'En défaut'),
        (STATUS_CANCELLED, 'Annulé'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_number = models.CharField(max_length=50, unique=True, editable=False)

    # Utilisateur et produit
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credit_requests')
    product = models.ForeignKey(CreditProduct, on_delete=models.PROTECT)

    # Demande initiale
    amount_requested = models.DecimalField(max_digits=12, decimal_places=2)
    duration_months = models.IntegerField(validators=[MinValueValidator(1)])
    purpose = models.TextField(help_text="Motif du crédit")

    # Données au moment de la demande
    monthly_income_declared = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Revenus mensuels déclarés"
    )
    crm_calculated = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="CRM (30% revenus nets) calculé"
    )
    teras_score_at_request = models.IntegerField(
        default=0,
        help_text="Score TERAS au moment de la demande"
    )
    teras_band_at_request = models.CharField(
        max_length=5,
        blank=True,
        help_text="Bande de score (A+, A, B, C, D, E)"
    )

    # Statut
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )

    # Décision
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_credits'
    )
    amount_approved = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    interest_rate_approved = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Taux annuel approuvé (%)"
    )
    monthly_payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    total_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Coût total (capital + intérêts)"
    )

    rejection_reason = models.TextField(blank=True)
    ai_recommendation = models.JSONField(
        default=dict,
        blank=True,
        help_text="Recommandation IA/Algorithme"
    )

    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    disbursed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande de crédit"
        verbose_name_plural = "Demandes de crédit"

    def __str__(self):
        return f"{self.request_number} - {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.request_number:
            # Générer numéro unique
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            self.request_number = f"CR-{timestamp}-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)

    def accept_offer(self):
        """Utilisateur accepte l'offre approuvée"""
        if self.status == self.STATUS_APPROVED:
            self.status = self.STATUS_ACCEPTED
            self.save()
            # TODO: Créer l'échéancier de paiement
            self._create_payment_schedule()

    def _create_payment_schedule(self):
        """Génère l'échéancier de remboursement"""
        if not self.amount_approved or not self.monthly_payment:
            return

        # Importer ici pour éviter circular import
        from .utils.loan_calculator import generate_payment_schedule

        schedule = generate_payment_schedule(
            amount=self.amount_approved,
            monthly_payment=self.monthly_payment,
            duration_months=self.duration_months,
            annual_rate=self.interest_rate_approved or self.product.get_average_rate(),
            start_date=timezone.now().date()
        )

        # Créer les échéances
        for payment in schedule:
            CreditPaymentSchedule.objects.create(
                credit_request=self,
                payment_number=payment['payment_number'],
                due_date=payment['due_date'],
                principal_amount=Decimal(str(payment['principal_amount'])),
                interest_amount=Decimal(str(payment['interest_amount'])),
                total_amount=Decimal(str(payment['total_amount'])),
                remaining_balance=Decimal(str(payment['remaining_balance']))
            )


class CreditGuarantee(models.Model):
    """
    Garantie associée à une demande de crédit
    (Co-emprunteur, Gage moto, Terrain, etc.)
    """

    TYPE_COEMPRUNTOR = 'coempruntor'
    TYPE_VEHICLE = 'vehicle'
    TYPE_LAND = 'land'
    TYPE_EQUIPMENT = 'equipment'
    TYPE_STOCK = 'stock'
    TYPE_OTHER = 'other'

    TYPE_CHOICES = [
        (TYPE_COEMPRUNTOR, 'Co-emprunteur/Caution'),
        (TYPE_VEHICLE, 'Véhicule/Moto'),
        (TYPE_LAND, 'Terrain/Parcelle'),
        (TYPE_EQUIPMENT, 'Équipement/Matériel'),
        (TYPE_STOCK, 'Stock/Marchandise'),
        (TYPE_OTHER, 'Autre'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_VERIFIED = 'verified'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente de vérification'),
        (STATUS_VERIFIED, 'Vérifiée'),
        (STATUS_REJECTED, 'Rejetée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_request = models.ForeignKey(
        CreditRequest,
        on_delete=models.CASCADE,
        related_name='guarantees'
    )

    guarantee_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField()
    estimated_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Valeur estimée en CDF"
    )

    # Documents justificatifs
    documents = models.JSONField(
        default=list,
        blank=True,
        help_text="URLs des documents (photos, attestations)"
    )

    # Vérification
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    verification_notes = models.TextField(blank=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_guarantees'
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Garantie"
        verbose_name_plural = "Garanties"

    def __str__(self):
        return f"{self.get_guarantee_type_display()} - {self.credit_request.request_number}"


class CreditPaymentSchedule(models.Model):
    """
    Échéancier de remboursement d'un crédit
    """

    STATUS_PENDING = 'pending'
    STATUS_PAID = 'paid'
    STATUS_LATE = 'late'
    STATUS_MISSED = 'missed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_PAID, 'Payé'),
        (STATUS_LATE, 'Retard'),
        (STATUS_MISSED, 'Manqué'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credit_request = models.ForeignKey(
        CreditRequest,
        on_delete=models.CASCADE,
        related_name='payment_schedule'
    )

    payment_number = models.IntegerField(help_text="Numéro d'échéance (1, 2, 3...)")
    due_date = models.DateField(help_text="Date d'échéance")

    # Montants
    principal_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Part du capital"
    )
    interest_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Part des intérêts"
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Montant total à payer"
    )
    remaining_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Solde restant après ce paiement"
    )

    # Statut de paiement
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING
    )
    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0')
    )
    paid_date = models.DateTimeField(null=True, blank=True)
    late_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0'),
        help_text="Pénalités de retard"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['credit_request', 'payment_number']
        unique_together = ['credit_request', 'payment_number']
        verbose_name = "Échéance de paiement"
        verbose_name_plural = "Échéancier de paiement"

    def __str__(self):
        return f"{self.credit_request.request_number} - Échéance {self.payment_number}"

    @property
    def is_overdue(self):
        """Vérifie si l'échéance est en retard"""
        if self.status == self.STATUS_PAID:
            return False
        return timezone.now().date() > self.due_date


class CreditHistory(models.Model):
    """
    Historique de crédit d'un utilisateur
    Génère des métriques pour le pilier E (Engagement) du score TERAS
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credit_history')
    credit_request = models.OneToOneField(
        CreditRequest,
        on_delete=models.CASCADE,
        related_name='history'
    )

    # Métriques de remboursement
    total_payments_made = models.IntegerField(default=0)
    on_time_payments = models.IntegerField(default=0)
    late_payments = models.IntegerField(default=0)
    missed_payments = models.IntegerField(default=0)

    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))
    total_late_fees = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0'))

    # Délais moyens
    average_payment_delay_days = models.IntegerField(
        default=0,
        help_text="Retard moyen en jours"
    )
    max_payment_delay_days = models.IntegerField(
        default=0,
        help_text="Retard maximum en jours"
    )

    # Statut final
    was_completed = models.BooleanField(default=False)
    was_defaulted = models.BooleanField(default=False)
    completion_date = models.DateField(null=True, blank=True)

    # Score comportemental (0-100)
    behavior_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Score de comportement de remboursement"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Historique de crédit"
        verbose_name_plural = "Historiques de crédit"

    def __str__(self):
        return f"Historique - {self.user.username} - {self.credit_request.request_number}"

    def calculate_behavior_score(self):
        """
        Calcule le score de comportement (0-100)
        Basé sur ponctualité, completion, montant remboursé
        """
        if self.total_payments_made == 0:
            return 0

        # Taux de paiements à temps (50%)
        on_time_rate = (self.on_time_payments / self.total_payments_made) * 50

        # Absence de retards graves (30%)
        delay_penalty = min(self.average_payment_delay_days * 2, 30)
        delay_score = max(0, 30 - delay_penalty)

        # Completion (20%)
        completion_score = 20 if self.was_completed else 0

        total = on_time_rate + delay_score + completion_score

        # Pénalité si défaut
        if self.was_defaulted:
            total = min(total, 30)

        self.behavior_score = int(total)
        self.save(update_fields=['behavior_score'])

        return self.behavior_score