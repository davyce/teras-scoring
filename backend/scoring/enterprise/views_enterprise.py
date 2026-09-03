"""
Vues API Django REST Framework pour TERAS Entreprise
Gestion complète de l'interface Enterprise

TOUS LES ENDPOINTS:
Dashboard:
  GET  /api/enterprise/dashboard/                Dashboard principal

Clients B2B:
  GET  /api/enterprise/clients/                  Liste clients
  POST /api/enterprise/clients/                  Créer client
  GET  /api/enterprise/clients/{id}/             Détail client
  PATCH /api/enterprise/clients/{id}/            Modifier client
  DELETE /api/enterprise/clients/{id}/           Supprimer client

Employés:
  GET  /api/enterprise/employees/                Liste employés
  POST /api/enterprise/employees/                Ajouter employé
  GET  /api/enterprise/employees/{id}/           Détail employé
  PATCH /api/enterprise/employees/{id}/          Modifier employé
  DELETE /api/enterprise/employees/{id}/         Supprimer employé

Documents:
  GET  /api/enterprise/documents/                Liste documents
  POST /api/enterprise/documents/upload/         Upload document

Conformité:
  GET  /api/enterprise/compliance/               Statut conformité

Rapports:
  GET  /api/enterprise/reports/                  Liste rapports
  POST /api/enterprise/reports/generate/         Générer rapport
  GET  /api/enterprise/reports/{id}/download/    Télécharger rapport

Analytics:
  GET  /api/enterprise/analytics/sector/         Analytics sectorielle
  GET  /api/enterprise/analytics/trends/         Tendances & prédictions
"""

# Import de la partie 1 (Dashboard, Clients, Employees, Documents)
from .views_enterprise_part1 import (
    IsEnterpriseUser,
    EnterpriseDashboardView,
    EnterpriseClientsListView,
    EnterpriseClientDetailView,
    EnterpriseEmployeesListView,
    EnterpriseEmployeeDetailView,
    EnterpriseDocumentsListView,
    EnterpriseDocumentUploadView,
)

# Import de la partie 2 (Compliance, Reports, Analytics)
from .views_enterprise_part2 import (
    EnterpriseComplianceView,
    EnterpriseReportsListView,
    EnterpriseReportGenerateView,
    EnterpriseReportDownloadView,
    EnterpriseSectorAnalyticsView,
    EnterpriseTrendsView,
)

# Toutes les vues sont maintenant disponibles via ce fichier unique
__all__ = [
    'IsEnterpriseUser',
    'EnterpriseDashboardView',
    'EnterpriseClientsListView',
    'EnterpriseClientDetailView',
    'EnterpriseEmployeesListView',
    'EnterpriseEmployeeDetailView',
    'EnterpriseDocumentsListView',
    'EnterpriseDocumentUploadView',
    'EnterpriseComplianceView',
    'EnterpriseReportsListView',
    'EnterpriseReportGenerateView',
    'EnterpriseReportDownloadView',
    'EnterpriseSectorAnalyticsView',
    'EnterpriseTrendsView',
]
