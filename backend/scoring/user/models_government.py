# backend/scoring/models_government.py
"""
Modèles pour l'interface Government TERAS
Version simplifiée avec données mockées pour développement
"""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Region(models.Model):
    """Modèle pour les régions géographiques"""
    REGION_CHOICES = [
        ('kinshasa', 'Kinshasa'),
        ('lubumbashi', 'Lubumbashi'),
        ('goma', 'Goma'),
        ('kisangani', 'Kisangani'),
        ('mbuji_mayi', 'Mbuji-Mayi'),
        ('kananga', 'Kananga'),
        ('bukavu', 'Bukavu'),
        ('matadi', 'Matadi'),
        ('kolwezi', 'Kolwezi'),
        ('likasi', 'Likasi'),
    ]
    
    name = models.CharField(max_length=100, choices=REGION_CHOICES, unique=True)
    code = models.CharField(max_length=10, unique=True)
    population = models.IntegerField(default=0)
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    avg_score = models.FloatField(default=0.0)
    gdp = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    unemployment_rate = models.FloatField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-avg_score']
        verbose_name = 'Région'
        verbose_name_plural = 'Régions'
    
    def __str__(self):
        return self.get_name_display()
    
    def calculate_active_rate(self):
        """Calcule le taux d'utilisateurs actifs"""
        if self.total_users == 0:
            return 0.0
        return round(self.active_users / self.total_users, 2)


class Sector(models.Model):
    """Modèle pour les secteurs économiques"""
    SECTOR_CHOICES = [
        ('agriculture', 'Agriculture'),
        ('mining', 'Mines'),
        ('manufacturing', 'Industrie'),
        ('services', 'Services'),
        ('commerce', 'Commerce'),
        ('construction', 'Construction'),
        ('energy', 'Énergie'),
        ('transport', 'Transport'),
        ('telecom', 'Télécommunications'),
        ('finance', 'Finance'),
    ]
    
    name = models.CharField(max_length=100, choices=SECTOR_CHOICES, unique=True)
    code = models.CharField(max_length=10, unique=True)
    total_enterprises = models.IntegerField(default=0)
    avg_score = models.FloatField(default=0.0)
    growth_rate = models.FloatField(default=0.0)
    gdp_contribution = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    employment = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-avg_score']
        verbose_name = 'Secteur'
        verbose_name_plural = 'Secteurs'
    
    def __str__(self):
        return self.get_name_display()


class Alert(models.Model):
    """Modèle pour les alertes système"""
    SEVERITY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyenne'),
        ('high', 'Élevée'),
        ('critical', 'Critique'),
    ]
    
    CATEGORY_CHOICES = [
        ('economic', 'Économique'),
        ('social', 'Social'),
        ('security', 'Sécurité'),
        ('technical', 'Technique'),
        ('fraud', 'Fraude'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acquittée'),
        ('resolved', 'Résolue'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    sector = models.ForeignKey(Sector, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    impact_score = models.IntegerField(default=0)
    affected_users = models.IntegerField(default=0)
    recommendations = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Alerte'
        verbose_name_plural = 'Alertes'
    
    def __str__(self):
        return f"{self.title} ({self.get_severity_display()})"


class GovernmentReport(models.Model):
    """Modèle pour les rapports gouvernementaux"""
    REPORT_TYPE_CHOICES = [
        ('daily', 'Quotidien'),
        ('weekly', 'Hebdomadaire'),
        ('monthly', 'Mensuel'),
        ('quarterly', 'Trimestriel'),
        ('annual', 'Annuel'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En traitement'),
        ('ready', 'Prêt'),
        ('failed', 'Échoué'),
    ]
    
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    period_start = models.DateField()
    period_end = models.DateField()
    summary = models.JSONField(default=dict)
    data = models.JSONField(default=dict, blank=True)
    file = models.FileField(upload_to='reports/', null=True, blank=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    downloaded_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-generated_at']
        verbose_name = 'Rapport'
        verbose_name_plural = 'Rapports'
    
    def __str__(self):
        return f"{self.title} - {self.period_start} to {self.period_end}"


class GovernmentSettings(models.Model):
    """Modèle pour les paramètres gouvernementaux"""
    system_version = models.CharField(max_length=20, default='1.0.0')
    environment = models.CharField(max_length=20, default='production')
    maintenance_mode = models.BooleanField(default=False)
    
    scoring_profile = models.CharField(max_length=20, default='basic')
    scoring_region = models.CharField(max_length=20, default='CEMAC')
    scoring_country = models.CharField(max_length=20, default='Congo')
    
    alerts_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    threshold_low_score = models.IntegerField(default=400)
    threshold_high_risk = models.IntegerField(default=600)
    
    api_rate_limit = models.IntegerField(default=1000)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Paramètres'
        verbose_name_plural = 'Paramètres'
    
    def __str__(self):
        return f"Settings (v{self.system_version})"


class ActivityLog(models.Model):
    """Log des activités pour le dashboard"""
    ACTION_CHOICES = [
        ('score_calc', 'Calcul de score'),
        ('user_created', 'Utilisateur créé'),
        ('enterprise_created', 'Entreprise créée'),
        ('alert_created', 'Alerte créée'),
        ('report_generated', 'Rapport généré'),
    ]
    
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=20)
    score = models.IntegerField(null=True, blank=True)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Log d\'activité'
        verbose_name_plural = 'Logs d\'activité'
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.user.email} - {self.timestamp}"
