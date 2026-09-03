"""
Modèles Django pour l'interface TERAS Entreprise
Gestion des clients B2B, employés, documents, conformité et rapports
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class EnterpriseClient(models.Model):
    """
    Représente un client (dossier) analysé par une entreprise
    Permet aux entreprises de gérer leur portefeuille de clients B2B
    """
    CLIENT_TYPES = [
        ('individual', 'Particulier'),
        ('pme', 'PME'),
        ('company', 'Entreprise'),
    ]
    
    RISK_LEVELS = [
        ('low', 'Faible'),
        ('medium', 'Moyen'),
        ('high', 'Élevé'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('pending', 'En attente'),
        ('archived', 'Archivé'),
    ]
    
    enterprise = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clients',
        help_text="Entreprise propriétaire de ce dossier"
    )
    name = models.CharField(
        max_length=255,
        help_text="Nom du client ou raison sociale"
    )
    client_type = models.CharField(
        max_length=20,
        choices=CLIENT_TYPES,
        default='individual'
    )
    kyc_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="Identifiant KYC unique du client"
    )
    internal_ref = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Référence interne de l'entreprise"
    )
    
    # Score TERAS du client
    teras_score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        help_text="Score TERAS du client (0-1000)"
    )
    
    # Évaluation du risque
    risk_level = models.CharField(
        max_length=10,
        choices=RISK_LEVELS,
        default='medium',
        help_text="Niveau de risque calculé"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Métadonnées
    notes = models.TextField(
        blank=True,
        help_text="Notes internes sur le client"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['enterprise', 'status']),
            models.Index(fields=['teras_score']),
            models.Index(fields=['risk_level']),
        ]
        verbose_name = "Client Entreprise"
        verbose_name_plural = "Clients Entreprise"
    
    def __str__(self):
        return f"{self.name} ({self.get_client_type_display()})"
    
    def calculate_risk_level(self):
        """Calcule le niveau de risque basé sur le score TERAS"""
        if not self.teras_score:
            return 'medium'
        
        if self.teras_score >= 700:
            return 'low'
        elif self.teras_score >= 500:
            return 'medium'
        else:
            return 'high'
    
    def save(self, *args, **kwargs):
        # Recalculer le risque avant sauvegarde
        if self.teras_score:
            self.risk_level = self.calculate_risk_level()
        super().save(*args, **kwargs)


class Employee(models.Model):
    """
    Représente un employé déclaré par une entreprise
    Impact direct sur le pilier E (Emploi local) du score TERAS Entreprise
    """
    EMPLOYMENT_TYPES = [
        ('permanent', 'CDI'),
        ('contract', 'CDD'),
        ('intern', 'Stage'),
        ('temporary', 'Intérimaire'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Actif'),
        ('on_leave', 'En congé'),
        ('terminated', 'Parti'),
    ]
    
    enterprise = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employees',
        help_text="Entreprise employeur"
    )
    
    # Informations personnelles
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    employee_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="Matricule employé"
    )
    
    # Informations professionnelles
    position = models.CharField(
        max_length=100,
        help_text="Poste occupé"
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        help_text="Département"
    )
    hire_date = models.DateField(
        help_text="Date d'embauche"
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPES,
        default='permanent'
    )
    
    # Informations salariales (optionnel)
    salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Salaire mensuel brut (optionnel)"
    )
    
    # Critère important pour TERAS (Emploi local)
    is_local = models.BooleanField(
        default=True,
        help_text="Employé recruté localement (impact pilier E)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    termination_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date de départ si applicable"
    )
    
    # Coordonnées
    email = models.EmailField(blank=True, help_text="Email professionnel")
    phone = models.CharField(max_length=20, blank=True)
    niu   = models.CharField(max_length=50, blank=True, verbose_name="NIU")

    # Lien compte TERAS individuel (optionnel)
    teras_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='employer_enterprise_profiles',
    )

    # Lien BankEnterprise (optionnel, si dossier banque créé)
    bank_enterprise = models.ForeignKey(
        'scoring.BankEnterprise',
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='enterprise_employees',
    )

    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-hire_date']
        indexes = [
            models.Index(fields=['enterprise', 'status']),
            models.Index(fields=['is_local']),
        ]
        verbose_name = "Employé"
        verbose_name_plural = "Employés"
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.position}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_active(self):
        return self.status == 'active'


class EnterpriseDocument(models.Model):
    """
    Documents uploadés par l'entreprise (bilans, factures, fiches de paie, etc.)
    Impact sur pilier T (Transparence fiscale)
    """
    CATEGORY_CHOICES = [
        ('tax_filing', 'Déclaration fiscale'),
        ('balance_sheet', 'Bilan comptable'),
        ('invoice', 'Facture'),
        ('payroll', 'Fiche de paie'),
        ('bank_statement', 'Relevé bancaire'),
        ('contract', 'Contrat'),
        ('other', 'Autre'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En traitement'),
        ('validated', 'Validé'),
        ('rejected', 'Rejeté'),
    ]
    
    enterprise = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enterprise_documents',
        help_text="Entreprise propriétaire"
    )
    
    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES,
        default='other'
    )
    title = models.CharField(
        max_length=255,
        help_text="Titre du document"
    )
    file = models.FileField(
        upload_to='enterprise_docs/%Y/%m/',
        help_text="Fichier uploadé"
    )
    
    # Période couverte par le document
    period = models.CharField(
        max_length=50,
        blank=True,
        help_text="Période couverte (ex: Q3 2024, Année 2024)"
    )
    period_start = models.DateField(
        null=True,
        blank=True,
        help_text="Début de période"
    )
    period_end = models.DateField(
        null=True,
        blank=True,
        help_text="Fin de période"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Résultat du traitement
    analysis_summary = models.JSONField(
        null=True,
        blank=True,
        help_text="Résultat de l'analyse automatique"
    )
    validation_notes = models.TextField(
        blank=True,
        help_text="Notes de validation"
    )
    
    # Métadonnées
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date de traitement"
    )
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['enterprise', 'category']),
            models.Index(fields=['status']),
        ]
        verbose_name = "Document Entreprise"
        verbose_name_plural = "Documents Entreprise"
    
    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class ComplianceStatus(models.Model):
    """
    Statut de conformité fiscale et réglementaire de l'entreprise
    Impact majeur sur pilier T (Transparence fiscale) - 30% du score
    """
    enterprise = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='compliance_status',
        help_text="Entreprise concernée"
    )
    
    # Taux de conformité global (0-100%)
    compliance_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=0,
        help_text="Taux de conformité global (%)"
    )
    
    # Déclarations fiscales
    last_tax_filing = models.DateField(
        null=True,
        blank=True,
        help_text="Date dernière déclaration fiscale"
    )
    missing_declarations = models.JSONField(
        default=list,
        help_text="Liste des déclarations manquantes"
    )
    
    # Paiements et pénalités
    late_payments = models.IntegerField(
        default=0,
        help_text="Nombre de paiements en retard"
    )
    penalties = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Montant total des pénalités"
    )
    
    # Alertes et recommandations
    active_alerts = models.JSONField(
        default=list,
        help_text="Alertes actives de conformité"
    )
    recommendations = models.JSONField(
        default=list,
        help_text="Recommandations pour améliorer la conformité"
    )
    
    # Métadonnées
    last_audit_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date dernier audit"
    )
    next_audit_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date prochain audit prévu"
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Statut de Conformité"
        verbose_name_plural = "Statuts de Conformité"
    
    def __str__(self):
        return f"Conformité {self.enterprise.email}: {self.compliance_rate}%"
    
    def calculate_compliance_rate(self):
        """
        Calcule le taux de conformité basé sur plusieurs critères:
        - Déclarations à jour
        - Pas de retards de paiement
        - Pas de pénalités actives
        """
        score = 100
        
        # Pénaliser les déclarations manquantes (-10% par déclaration)
        if self.missing_declarations:
            score -= len(self.missing_declarations) * 10
        
        # Pénaliser les retards de paiement (-5% par retard)
        if self.late_payments > 0:
            score -= self.late_payments * 5
        
        # Pénaliser les pénalités financières
        if self.penalties > 0:
            score -= 15
        
        return max(0, min(100, score))
    
    def save(self, *args, **kwargs):
        # Recalculer le taux de conformité avant sauvegarde
        self.compliance_rate = self.calculate_compliance_rate()
        super().save(*args, **kwargs)


class EnterpriseReport(models.Model):
    """
    Rapports TERAS générés pour l'entreprise
    Exports PDF des analyses trimestrielles, annuelles, sectorielles
    """
    REPORT_TYPES = [
        ('quarterly', 'Rapport Trimestriel'),
        ('annual', 'Rapport Annuel'),
        ('sector_comparison', 'Comparaison Sectorielle'),
        ('custom', 'Rapport Personnalisé'),
    ]
    
    STATUS_CHOICES = [
        ('generating', 'En génération'),
        ('ready', 'Prêt'),
        ('failed', 'Échec'),
    ]
    
    enterprise = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports',
        help_text="Entreprise concernée"
    )
    
    report_type = models.CharField(
        max_length=30,
        choices=REPORT_TYPES,
        default='quarterly'
    )
    title = models.CharField(
        max_length=255,
        help_text="Titre du rapport"
    )
    
    # Période couverte
    period_start = models.DateField(
        help_text="Début de période"
    )
    period_end = models.DateField(
        help_text="Fin de période"
    )
    
    # Fichier généré
    file = models.FileField(
        upload_to='enterprise_reports/%Y/%m/',
        null=True,
        blank=True,
        help_text="Fichier PDF du rapport"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='generating'
    )
    
    # Métadonnées du rapport
    report_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Données brutes du rapport"
    )
    
    # Métadonnées
    generated_at = models.DateTimeField(auto_now_add=True)
    downloaded_count = models.IntegerField(
        default=0,
        help_text="Nombre de téléchargements"
    )
    
    class Meta:
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['enterprise', 'report_type']),
            models.Index(fields=['status']),
        ]
        verbose_name = "Rapport Entreprise"
        verbose_name_plural = "Rapports Entreprise"
    
    def __str__(self):
        return f"{self.title} - {self.get_report_type_display()}"


class EnterpriseScore(models.Model):
    """
    Historique des scores TERAS Entreprise
    Formule: TERAS = 0.30*T + 0.25*E + 0.15*R + 0.20*A + 0.10*S
    """
    enterprise = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enterprise_scores',
        help_text="Entreprise évaluée"
    )
    
    # Score total (0-1000)
    score = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        help_text="Score TERAS Entreprise total"
    )
    
    # Décomposition par pilier (valeurs 0-1 normalisées)
    breakdown = models.JSONField(
        help_text="Décomposition détaillée: {T, E, R, A, S}"
    )
    
    # Données d'entrée (optionnel, pour traçabilité)
    input_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Données utilisées pour le calcul"
    )
    
    # Comparaison sectorielle
    sector = models.CharField(
        max_length=100,
        blank=True,
        help_text="Secteur d'activité"
    )
    sector_average = models.IntegerField(
        null=True,
        blank=True,
        help_text="Score moyen du secteur"
    )
    percentile = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentile dans le secteur"
    )
    
    # Métadonnées
    computed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-computed_at']
        indexes = [
            models.Index(fields=['enterprise', '-computed_at']),
            models.Index(fields=['score']),
        ]
        verbose_name = "Score TERAS Entreprise"
        verbose_name_plural = "Scores TERAS Entreprise"
    
    def __str__(self):
        return f"{self.enterprise.email} - Score: {self.score} ({self.computed_at.strftime('%Y-%m-%d')})"


class TeamMember(models.Model):
    """Membre de l'équipe ayant accès à l'interface Entreprise TERAS."""
    ROLE_CHOICES = [
        ('admin',   'Admin — Accès complet'),
        ('manager', 'Manager — Gestion employés & rapports'),
        ('analyst', 'Analyst — Consultation & rapports'),
        ('viewer',  'Viewer — Consultation uniquement'),
    ]

    # Lien via user enterprise (interface TERAS Entreprise)
    enterprise_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enterprise_team_owned',
        null=True, blank=True,
        help_text="User propriétaire de l'espace entreprise"
    )
    # Lien via BankEnterprise (si créé par la banque)
    bank_enterprise = models.ForeignKey(
        'scoring.BankEnterprise',
        on_delete=models.CASCADE,
        related_name='team_members',
        null=True, blank=True,
    )
    # Membre invité
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enterprise_memberships',
    )
    role      = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'enterprise_team_members'
        verbose_name = "Membre équipe"

    def __str__(self):
        return f"{self.user.email} — {self.get_role_display()}"
