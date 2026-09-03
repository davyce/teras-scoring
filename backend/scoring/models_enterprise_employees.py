# backend/scoring/models_enterprise_employees.py
"""
Modèles pour la gestion des employés et membres d'équipe de l'interface Entreprise.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

User = get_user_model()


class Employee(models.Model):
    """Employé d'une entreprise — lié optionnellement à un compte TERAS individuel."""
    STATUS_CHOICES = [
        ('active',     'Actif'),
        ('inactive',   'Inactif'),
        ('on_leave',   'En congé'),
        ('terminated', 'Licencié'),
    ]

    # Entreprise (via profil bancaire)
    bank_enterprise = models.ForeignKey(
        'scoring.BankEnterprise',
        on_delete=models.CASCADE,
        related_name='employees',
        null=True, blank=True,
    )

    # Infos personnelles
    first_name  = models.CharField(max_length=100)
    last_name   = models.CharField(max_length=100)
    email       = models.EmailField()
    phone       = models.CharField(max_length=20, blank=True)
    niu         = models.CharField(max_length=50, blank=True,
                                   verbose_name="NIU (Numéro d'Identification Universel)")

    # Poste
    position    = models.CharField(max_length=100, blank=True, verbose_name="Poste / Fonction")
    department  = models.CharField(max_length=100, blank=True, verbose_name="Département")
    salary      = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True,
                                       verbose_name="Salaire mensuel (FCFA)")
    hire_date   = models.DateField(null=True, blank=True, verbose_name="Date d'embauche")
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Lien compte TERAS individuel (optionnel)
    teras_user  = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='employer_profiles',
        help_text="Compte TERAS individuel de cet employé"
    )

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enterprise_employees'
        ordering = ['last_name', 'first_name']
        verbose_name = "Employé"
        unique_together = [('bank_enterprise', 'email')]

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.position}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class TeamMember(models.Model):
    """Membre de l'équipe ayant accès à l'interface Entreprise TERAS."""
    ROLE_CHOICES = [
        ('admin',   'Admin — Accès complet'),
        ('manager', 'Manager — Gestion employés & rapports'),
        ('analyst', 'Analyst — Consultation & rapports'),
        ('viewer',  'Viewer — Consultation uniquement'),
    ]

    enterprise = models.ForeignKey(
        'scoring.BankEnterprise',
        on_delete=models.CASCADE,
        related_name='team_members',
    )
    user       = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='enterprise_memberships',
    )
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    is_active  = models.BooleanField(default=True)
    joined_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'enterprise_team_members'
        unique_together = [('enterprise', 'user')]
        verbose_name = "Membre équipe"

    def __str__(self):
        return f"{self.user.email} — {self.get_role_display()}"
