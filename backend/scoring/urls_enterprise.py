"""
scoring/urls_enterprise.py — Routes Interface Entreprise (version finale corrigée)
Classes vérifiées depuis views_enterprise_part1.py et views_enterprise_part2.py
"""

from django.urls import path

# ── Part 1 (classes vérifiées) ───────────────────────────────────────────────
from .views_enterprise_part1 import (
    EnterpriseDashboardView,
    EnterpriseClientsListView,
    EnterpriseClientDetailView,
    EnterpriseEmployeesListView,
    EnterpriseEmployeeDetailView,
    EnterpriseDocumentsListView,
    EnterpriseDocumentUploadView,
    EnterpriseDocumentAnalyzeView,
    EnterpriseDocumentApplyView,
)

# ── Part 2 (classes vérifiées) ───────────────────────────────────────────────
from .views_enterprise_part2 import (
    EnterpriseComplianceView,
    EnterpriseProfileView,
    EnterpriseTransactionsView,
    EnterpriseNotificationsView,
    EnterpriseSettingsView,
    EnterpriseSupportTicketsView,
    enterprise_support_ticket_reply,
    enterprise_support_ticket_close,
    EnterpriseAIChatView,
    EnterpriseSectorAnalyticsView,
    EnterpriseTrendsView,
)

# ── Rapports IA (nouveau module — noms sans conflit) ─────────────────────────
from .views_enterprise_reports import (
    EnterpriseReportAIGenerateView,
    EnterpriseReportAIExportPDFView,
    EnterpriseReportAIHistoryView,
    EnterpriseReportAIDeleteView,
    EnterpriseReportAITypesView,
)

urlpatterns = [
    # ── Dashboard ─────────────────────────────────────────────────────────────
    path("dashboard/",          EnterpriseDashboardView.as_view(),          name="enterprise-dashboard"),

    # ── Profil ────────────────────────────────────────────────────────────────
    path("profile/",            EnterpriseProfileView.as_view(),            name="enterprise-profile"),

    # ── Transactions ──────────────────────────────────────────────────────────
    path("transactions/",       EnterpriseTransactionsView.as_view(),       name="enterprise-transactions"),

    # ── Clients ───────────────────────────────────────────────────────────────
    path("clients/",            EnterpriseClientsListView.as_view(),        name="enterprise-clients"),
    path("clients/<int:pk>/",   EnterpriseClientDetailView.as_view(),       name="enterprise-client-detail"),

    # ── Documents ─────────────────────────────────────────────────────────────
    path("documents/",          EnterpriseDocumentsListView.as_view(),      name="enterprise-documents"),
    path("documents/upload/",   EnterpriseDocumentUploadView.as_view(),     name="enterprise-documents-upload"),
    path("documents/<int:document_id>/analyze/", EnterpriseDocumentAnalyzeView.as_view(), name="enterprise-documents-analyze"),
    path("documents/<int:document_id>/apply/",   EnterpriseDocumentApplyView.as_view(),   name="enterprise-documents-apply"),

    # ── Employés ──────────────────────────────────────────────────────────────
    path("employees/",          EnterpriseEmployeesListView.as_view(),      name="enterprise-employees"),
    path("employees/<int:pk>/", EnterpriseEmployeeDetailView.as_view(),     name="enterprise-employee-detail"),

    # ── Conformité ────────────────────────────────────────────────────────────
    path("compliance/",         EnterpriseComplianceView.as_view(),         name="enterprise-compliance"),

    # ── Notifications ─────────────────────────────────────────────────────────
    path("notifications/",      EnterpriseNotificationsView.as_view(),      name="enterprise-notifications"),

    # ── Paramètres ────────────────────────────────────────────────────────────
    path("settings/",           EnterpriseSettingsView.as_view(),           name="enterprise-settings"),

    # ── Support ───────────────────────────────────────────────────────────────
    path("support/",            EnterpriseSupportTicketsView.as_view(),     name="enterprise-support"),
    path("support/<uuid:pk>/reply/", enterprise_support_ticket_reply,       name="enterprise-support-reply"),
    path("support/<uuid:pk>/close/", enterprise_support_ticket_close,       name="enterprise-support-close"),

    # ── Analytics ─────────────────────────────────────────────────────────────
    path("analytics/sectors/",  EnterpriseSectorAnalyticsView.as_view(),    name="enterprise-sectors"),
    path("analytics/trends/",   EnterpriseTrendsView.as_view(),             name="enterprise-trends"),

    # ── Assistant IA (existant dans part2) ────────────────────────────────────
    path("ai/chat/",            EnterpriseAIChatView.as_view(),             name="enterprise-ai-chat"),

    # ── Rapports IA (nouveau — Claude streaming + PDF) ────────────────────────
    path("reports/ai/types/",      EnterpriseReportAITypesView.as_view(),      name="enterprise-reports-ai-types"),
    path("reports/ai/generate/",   EnterpriseReportAIGenerateView.as_view(),   name="enterprise-reports-ai-generate"),
    path("reports/ai/export-pdf/", EnterpriseReportAIExportPDFView.as_view(),  name="enterprise-reports-ai-export"),
    path("reports/ai/history/",    EnterpriseReportAIHistoryView.as_view(),    name="enterprise-reports-ai-history"),
    path("reports/ai/<int:report_id>/delete/", EnterpriseReportAIDeleteView.as_view(), name="enterprise-reports-ai-delete"),
]
