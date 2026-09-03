# backend/scoring/models_government.py
"""
Modèles Django pour l'interface Government TERAS
Gestion des données gouvernementales, régions, secteurs, alertes
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Region(models.Model):
    """Régions géographiques du pays"""
    REGION_CHOICES = [
        ('kinshasa', 'Kinshasa'),
        ('lubumbashi', 'Lubumbashi'),
        ('goma', 'Goma'),
        ('kisangani', 'Kisangani'),
        ('mbuji-mayi', 'Mbuji-Mayi'),
        ('kananga', 'Kananga'),
        ('bukavu', 'Bukavu'),
        ('matadi', 'Matadi'),
        ('kikwit', 'Kikwit'),
        ('mbandaka', 'Mbandaka'),
    ]
    
    name = models.CharField(max_length=100, choices=REGION_CHOICES, unique=True)
    code = models.CharField(max_length=10, unique=True)  # Ex: KIN, LUB, GOM
    population = models.IntegerField(default=0)
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    avg_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(1000)]
    )
    
    # Métriques économiques
    gdp = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # PIB en FCFA
    unemployment_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # %
    
    # Coordonnées géographiques (pour carte)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'government_regions'
        ordering = ['-avg_score']
    
    def __str__(self):
        return f"{self.get_name_display()} - Score: {self.avg_score}"
    
    def calculate_active_rate(self):
        """Calcule le taux d'activité"""
        if self.total_users == 0:
            return 0
        return round((self.active_users / self.total_users) * 100, 2)


class Sector(models.Model):
    """Secteurs économiques"""
    SECTOR_CHOICES = [
        ('agriculture', 'Agriculture'),
        ('industrie', 'Industrie'),
        ('services', 'Services'),
        ('commerce', 'Commerce'),
        ('sante', 'Santé'),
        ('education', 'Éducation'),
        ('transport', 'Transport'),
        ('technologie', 'Technologie'),
        ('tourisme', 'Tourisme'),
        ('energie', 'Énergie'),
    ]
    
    name = models.CharField(max_length=100, choices=SECTOR_CHOICES, unique=True)
    code = models.CharField(max_length=10, unique=True)  # Ex: AGR, IND, SRV
    
    # Statistiques
    total_enterprises = models.IntegerField(default=0)
    avg_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(1000)]
    )
    growth_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # % croissance
    
    # Contribution économique
    gdp_contribution = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # FCFA
    employment = models.IntegerField(default=0)  # Nombre d'employés
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'government_sectors'
        ordering = ['-avg_score']
    
    def __str__(self):
        return f"{self.get_name_display()} - {self.total_enterprises} entreprises"


class Alert(models.Model):
    """Alertes système pour le gouvernement"""
    SEVERITY_CHOICES = [
        ('critical', 'Critique'),
        ('high', 'Élevée'),
        ('medium', 'Moyenne'),
        ('low', 'Faible'),
    ]
    
    CATEGORY_CHOICES = [
        ('economic', 'Économique'),
        ('fiscal', 'Fiscal'),
        ('social', 'Social'),
        ('security', 'Sécurité'),
        ('infrastructure', 'Infrastructure'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Prise en compte'),
        ('resolved', 'Résolue'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='economic')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Relations
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    sector = models.ForeignKey(Sector, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    
    # Métadonnées
    impact_score = models.IntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    affected_users = models.IntegerField(default=0)
    
    # Actions recommandées
    recommendations = models.JSONField(default=list, blank=True)  # Liste de recommandations
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'government_alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title}"


class GovernmentReport(models.Model):
    """Rapports gouvernementaux"""
    REPORT_TYPE_CHOICES = [
        ('monthly', 'Mensuel'),
        ('quarterly', 'Trimestriel'),
        ('annual', 'Annuel'),
        ('regional', 'Régional'),
        ('sectoral', 'Sectoriel'),
        ('custom', 'Personnalisé'),
    ]
    
    STATUS_CHOICES = [
        ('generating', 'En cours de génération'),
        ('ready', 'Prêt'),
        ('failed', 'Échec'),
    ]
    
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generating')
    
    # Période couverte
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Données du rapport
    summary = models.JSONField(default=dict, blank=True)  # Résumé des KPIs
    data = models.JSONField(default=dict, blank=True)  # Données complètes
    
    # Fichier généré
    file = models.FileField(upload_to='reports/government/', null=True, blank=True)
    
    # Métadonnées
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='government_reports')
    generated_at = models.DateTimeField(auto_now_add=True)
    downloaded_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'government_reports'
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.title}"


class GovernmentSettings(models.Model):
    """Paramètres système pour le gouvernement"""
    # Système
    system_version = models.CharField(max_length=20, default='1.0.0')
    environment = models.CharField(max_length=20, default='production')
    maintenance_mode = models.BooleanField(default=False)
    
    # Scoring
    scoring_profile = models.CharField(max_length=20, default='basic')  # basic, enterprise
    scoring_region = models.CharField(max_length=50, default='CEMAC')
    scoring_country = models.CharField(max_length=50, default='Congo')
    
    # Alertes
    alerts_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    threshold_low_score = models.IntegerField(default=400)
    threshold_high_risk = models.IntegerField(default=300)
    
    # API
    api_rate_limit = models.IntegerField(default=1000)  # Requêtes/heure
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'government_settings'
        verbose_name_plural = 'Government Settings'
    
    def __str__(self):
        return f"Settings v{self.system_version}"


class ActivityLog(models.Model):
    """Logs d'activité pour le dashboard"""
    ACTION_CHOICES = [
        ('score_calculated', 'Score calculé'),
        ('user_registered', 'Utilisateur inscrit'),
        ('enterprise_registered', 'Entreprise inscrite'),
        ('alert_created', 'Alerte créée'),
        ('report_generated', 'Rapport généré'),
    ]
    
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_type = models.CharField(max_length=20, blank=True)  # individual, enterprise
    score = models.IntegerField(null=True, blank=True)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True)
    
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'government_activity_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.timestamp}"
