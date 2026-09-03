# backend/scoring/urls_government.py
"""
Routes API pour l'interface Government TERAS
"""

from django.urls import path
from .views_government import (
    # Dashboard
    government_dashboard,
    # Régions
    government_regions_list,
    government_region_detail,
    # Secteurs
    government_sectors_list,
    government_sector_detail,
    # Analytics
    government_analytics_trends,
    government_analytics_comparison,
    # Alertes
    government_alerts_list,
    government_alert_detail,
    government_alert_create,
    government_alert_update_status,
    # Rapports
    government_reports_list,
    government_report_detail,
    government_report_generate,
    government_report_download,
    # Paramètres
    government_settings_get,
    government_settings_update,
)

urlpatterns = [
    # ==================== DASHBOARD ====================
    path('government/dashboard/', government_dashboard, name='government-dashboard'),
    
    # ==================== RÉGIONS ====================
    path('government/regions/', government_regions_list, name='government-regions-list'),
    path('government/regions/<int:region_id>/', government_region_detail, name='government-region-detail'),
    
    # ==================== SECTEURS ====================
    path('government/sectors/', government_sectors_list, name='government-sectors-list'),
    path('government/sectors/<int:sector_id>/', government_sector_detail, name='government-sector-detail'),
    
    # ==================== ANALYTICS ====================
    path('government/analytics/trends/', government_analytics_trends, name='government-analytics-trends'),
    path('government/analytics/comparison/', government_analytics_comparison, name='government-analytics-comparison'),
    
    # ==================== ALERTES ====================
    path('government/alerts/', government_alerts_list, name='government-alerts-list'),
    path('government/alerts/<int:alert_id>/', government_alert_detail, name='government-alert-detail'),
    path('government/alerts/create/', government_alert_create, name='government-alert-create'),
    path('government/alerts/<int:alert_id>/status/', government_alert_update_status, name='government-alert-update-status'),
    
    # ==================== RAPPORTS ====================
    path('government/reports/', government_reports_list, name='government-reports-list'),
    path('government/reports/<int:report_id>/', government_report_detail, name='government-report-detail'),
    path('government/reports/generate/', government_report_generate, name='government-report-generate'),
    path('government/reports/<int:report_id>/download/', government_report_download, name='government-report-download'),
    
    # ==================== PARAMÈTRES ====================
    path('government/settings/', government_settings_get, name='government-settings-get'),
    path('government/settings/update/', government_settings_update, name='government-settings-update'),
]
