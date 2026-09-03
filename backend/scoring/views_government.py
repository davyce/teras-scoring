# backend/scoring/views_government.py
"""
Vues pour l'interface Government TERAS
Point d'entrée unique combinant part1 et part2
"""

from .views_government_part1 import (
    IsGovernmentUser,
    StandardPagination,
    government_dashboard,
    government_regions_list,
    government_region_detail,
    government_sectors_list,
    government_sector_detail,
    government_analytics_trends,
    government_analytics_comparison,
)

from .views_government_part2 import (
    government_alerts_list,
    government_alert_detail,
    government_alert_create,
    government_alert_update_status,
    government_reports_list,
    government_report_detail,
    government_report_generate,
    government_report_download,
    government_settings_get,
    government_settings_update,
)

__all__ = [
    'IsGovernmentUser',
    'StandardPagination',
    # Dashboard
    'government_dashboard',
    # Régions
    'government_regions_list',
    'government_region_detail',
    # Secteurs
    'government_sectors_list',
    'government_sector_detail',
    # Analytics
    'government_analytics_trends',
    'government_analytics_comparison',
    # Alertes
    'government_alerts_list',
    'government_alert_detail',
    'government_alert_create',
    'government_alert_update_status',
    # Rapports
    'government_reports_list',
    'government_report_detail',
    'government_report_generate',
    'government_report_download',
    # Paramètres
    'government_settings_get',
    'government_settings_update',
]
