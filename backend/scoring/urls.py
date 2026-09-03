# backend/scoring/urls.py — VERSION FINALE COMPLÈTE
from django.urls import path, include

# ── User ──────────────────────────────────────────────────────────────────────
from .views_user import (
    UserDashboardView, UserScoreDetailView, UserRecommendationsView,
    UserDocumentsView, UserHistoryView, UserProfileView,
    UserTransactionsView, UserCreditSimulationView, ComputeScoreView,
    ChangePasswordView, BanquesCongoView,
)
from .views_kyc import UserKYCSubmitView, UserKYCStatusView, UserKYCListView
from .views_recommendations import GenerateDetailedRecommendationView, ExportRecommendationPDFView, RecommendationCompleteView
from .views_simulators import CreditSimulatorView, SavingsSimulatorView, ScoreImpactSimulatorView
from .views_ai_recommendations import GenerateSimulationRecommendationsView
from .views_history_analysis import AnalyzeHistoricalScoreView

# ── Documents (pipeline parsing complet) ──────────────────────────────────────
from .views_documents import (
    upload_document, list_documents, document_detail,
    delete_document, download_document, analyze_document, apply_to_score,
)

# ── Admin ──────────────────────────────────────────────────────────────────────
from .views_admin import (
    AdminDocumentsListView, AdminDashboardView, AdminUsersListView,
    AdminUserDetailView, AdminUserSuspendView, AdminUserRestoreView, AdminUsersMapView,
    AdminAnalyticsView, AdminActivitiesView, AdminKYCRequestsListView,
    AdminKYCRequestDetailView, AdminKYCApproveView, AdminKYCRejectView,
)

# ── Support ────────────────────────────────────────────────────────────────────
from .urls_support import user_support_urlpatterns

# ── Notifications banque → utilisateur individuel ─────────────────────────────
from .views_bank_notifications import (
    ClientBankMessagesView, ClientMarkMessageReadView, ClientMarkAllReadView,
    ClientMyApplicationsView, ClientAcceptApplicationView,
    ClientDeclineApplicationView, BankSendMessageView,
    ClientRequestApplicationView,
)

# ── Employés & Équipe entreprise ───────────────────────────────────────────────
from .views_enterprise_employees import (
    enterprise_employees_list, enterprise_employee_create,
    enterprise_employee_detail, enterprise_employee_link_teras,
    enterprise_team_list, enterprise_team_invite, enterprise_team_member,
)

# ── Communication banque ↔ entreprise ─────────────────────────────────────────
from .views_bank_enterprise_comms import (
    EnterpriseMessagesView, EnterpriseMarkMessageReadView, EnterpriseMarkAllReadView,
    EnterpriseMyApplicationsView, EnterpriseAcceptApplicationView,
    EnterpriseDeclineApplicationView, EnterpriseRequestApplicationView,
    EnterpriseProductsView, EnterpriseProfileBankView,
    BankSendEnterpriseMessageView,
)

# ── Bank ──────────────────────────────────────────────────────────────────────
from .views_bank import (
    bank_dashboard, bank_clients_list, bank_client_create,
    bank_client_detail, bank_client_refresh_passport, bank_client_update,
    bank_enterprises_list, bank_enterprise_create,
    bank_enterprise_detail, bank_enterprise_refresh_passport, bank_enterprise_update,
    bank_products_list, bank_product_create, bank_product_detail,
    bank_product_update, bank_product_delete,
    bank_applications_list, bank_application_submit,
    bank_application_detail, bank_application_review,
    bank_applications_pending, bank_applications_approved,
    bank_applications_rejected, bank_simulator,
    bank_analytics, bank_ai_chat,
)
from .views_bank_part2 import client_products_list, bank_application_update_amount

# ── Government ────────────────────────────────────────────────────────────────
from .views_government_data import (
    government_overview, government_country_detail, government_regions,
    government_sectors_analysis, government_macro_indicators, government_users_map,
    government_compliance_alerts, government_ai_context,
)
from .views_government_ai import (
    government_report_generate_enriched, government_ai_chat_enriched,
)
from .views_government import (
    government_dashboard, government_regions_list, government_region_detail,
    government_sectors_list, government_sector_detail,
    government_analytics_trends, government_analytics_comparison,
    government_alerts_list, government_alert_detail,
    government_alert_create, government_alert_update_status,
    government_reports_list, government_report_detail,
    government_report_generate, government_report_download,
    government_settings_get, government_settings_update,
)

from .views_bank_documents import (
    bank_upload_document, bank_list_documents, bank_document_detail,
    bank_delete_document, bank_download_document,
    bank_analyze_credit, bank_client_documents,
    bank_client_document_download, bank_client_document_review,
)
from .views_admin_documents import (
    admin_all_documents, admin_user_documents, admin_rag_upload,
    admin_rag_list, admin_rag_delete, admin_documents_stats, admin_document_download,
)
from .views_government_documents import (
    government_upload_document, government_list_documents,
    government_document_detail, government_delete_document,
    government_download_document, government_analyze_document,
)
from .views_validation import upload_document_for_user

from .views_bank_contract import generate_credit_contract

from .views_linked_accounts import (
    list_linked_accounts, add_linked_account, verify_linked_account,
    sync_linked_account, get_linked_account_transactions,
    apply_linked_transactions_to_score, delete_linked_account,
    set_primary_account, list_staff, invite_staff,
    update_staff_permissions, remove_staff, get_my_staff_access,
)

app_name = 'scoring'

# ─────────────────────────────────────────────────────────────────────────────
# USER PATTERNS
# ─────────────────────────────────────────────────────────────────────────────
user_urlpatterns = [
    path('dashboard/',                                UserDashboardView.as_view(),                      name='user-dashboard'),
    path('score/detail/',                             UserScoreDetailView.as_view(),                    name='user-score-detail'),
    path('compute/',                                  ComputeScoreView.as_view(),                       name='user-compute-score'),
    path('recommendations/',                          UserRecommendationsView.as_view(),                name='user-recommendations'),
    path('recommendations/generate-detail/',          GenerateDetailedRecommendationView.as_view(),     name='user-generate-detail'),
    path('recommendations/export-pdf/',               ExportRecommendationPDFView.as_view(),            name='user-export-pdf'),
    path('recommendations/generate-from-simulation/', GenerateSimulationRecommendationsView.as_view(),  name='user-generate-from-simulation'),
    path('recommendations/<int:pk>/complete/',         RecommendationCompleteView.as_view(),             name='user-recommendation-complete'),
    path('history/',                                  UserHistoryView.as_view(),                        name='user-history'),
    path('history/<int:score_id>/analyze/',           AnalyzeHistoricalScoreView.as_view(),             name='user-history-analyze'),
    path('profile/',                                  UserProfileView.as_view(),                        name='user-profile'),
    path('change-password/',                          ChangePasswordView.as_view(),                     name='user-change-password'),
    path('transactions/',                             UserTransactionsView.as_view(),                   name='user-transactions'),
    path('banques/',                                  BanquesCongoView.as_view(),                       name='user-banques'),
    # KYC
    path('kyc/submit/',                               UserKYCSubmitView.as_view(),                      name='user-kyc-submit'),
    path('kyc/status/',                               UserKYCStatusView.as_view(),                      name='user-kyc-status'),
    path('kyc/requests/',                             UserKYCListView.as_view(),                        name='user-kyc-list'),
    # Simulateurs
    path('simulators/credit/',                        CreditSimulatorView.as_view(),                    name='user-simulator-credit'),
    path('simulators/savings/',                       SavingsSimulatorView.as_view(),                   name='user-simulator-savings'),
    path('simulators/score-impact/',                  ScoreImpactSimulatorView.as_view(),               name='user-simulator-score'),
    # Documents — Pipeline parsing complet
    path('linked-accounts/',                                  list_linked_accounts,                   name='user-linked-accounts'),
    path('linked-accounts/add/',                              add_linked_account,                      name='user-linked-add'),
    path('linked-accounts/<int:account_id>/verify/',          verify_linked_account,                   name='user-linked-verify'),
    path('linked-accounts/<int:account_id>/sync/',            sync_linked_account,                     name='user-linked-sync'),
    path('linked-accounts/<int:account_id>/transactions/',    get_linked_account_transactions,          name='user-linked-txns'),
    path('linked-accounts/<int:account_id>/apply-to-score/',  apply_linked_transactions_to_score,      name='user-linked-apply'),
    path('linked-accounts/<int:account_id>/delete/',          delete_linked_account,                   name='user-linked-delete'),
    path('linked-accounts/<int:account_id>/set-primary/',     set_primary_account,                     name='user-linked-primary'),

    path('documents/upload/',                         upload_document,                                  name='doc-upload'),
    path('documents/list/',                           list_documents,                                   name='doc-list'),
    path('documents/<str:doc_id>/',                   document_detail,                                  name='doc-detail'),
    path('documents/<str:doc_id>/delete/',            delete_document,                                  name='doc-delete'),
    path('documents/<str:doc_id>/download/',          download_document,                                name='doc-download'),
    path('documents/<str:doc_id>/analyze/',           analyze_document,                                 name='doc-analyze'),
    path('documents/<str:doc_id>/apply/',             apply_to_score,                                   name='doc-apply'),
    # Banque → Client (messages & applications)
    path('bank-messages/',                            ClientBankMessagesView.as_view(),                 name='user-bank-messages'),
    path('bank-messages/<int:msg_id>/read/',          ClientMarkMessageReadView.as_view(),               name='user-bank-msg-read'),
    path('bank-messages/read-all/',                   ClientMarkAllReadView.as_view(),                  name='user-bank-msg-read-all'),
    path('my-applications/',                          ClientMyApplicationsView.as_view(),               name='user-applications'),
    path('my-applications/request/',                  ClientRequestApplicationView.as_view(),           name='user-application-request'),
    path('my-applications/<int:application_id>/accept/', ClientAcceptApplicationView.as_view(),         name='user-application-accept'),
    path('my-applications/<int:application_id>/decline/', ClientDeclineApplicationView.as_view(),      name='user-application-decline'),
    path('products/',                                 client_products_list,                             name='user-products'),
    # Support
    path('support/', include(user_support_urlpatterns)),
]

# ─────────────────────────────────────────────────────────────────────────────
# ADMIN PATTERNS
# ─────────────────────────────────────────────────────────────────────────────
admin_urlpatterns = [
    path('dashboard/',                                AdminDashboardView.as_view(),                     name='admin-dashboard'),
    path('users/',                                    AdminUsersListView.as_view(),                     name='admin-users'),
    path('users/map/',                                AdminUsersMapView.as_view(),                      name='admin-users-map'),
    path('users/<int:user_id>/',                      AdminUserDetailView.as_view(),                    name='admin-user-detail'),
    path('users/<int:user_id>/suspend/',              AdminUserSuspendView.as_view(),                   name='admin-user-suspend'),
    path('users/<int:user_id>/restore/',              AdminUserRestoreView.as_view(),                   name='admin-user-restore'),
    path('users/<int:user_id>/upload-document/',      upload_document_for_user,                         name='admin-upload-for-user'),
    path('analytics/',                                AdminAnalyticsView.as_view(),                     name='admin-analytics'),
    path('activities/',                               AdminActivitiesView.as_view(),                    name='admin-activities'),
    path('kyc/requests/',                             AdminKYCRequestsListView.as_view(),               name='admin-kyc-list'),
    path('kyc/requests/<int:kyc_id>/',                AdminKYCRequestDetailView.as_view(),              name='admin-kyc-detail'),
    path('kyc/requests/<int:kyc_id>/approve/',        AdminKYCApproveView.as_view(),                    name='admin-kyc-approve'),
    path('kyc/requests/<int:kyc_id>/reject/',         AdminKYCRejectView.as_view(),                     name='admin-kyc-reject'),
    path('documents/all/',                     admin_all_documents,   name='admin-docs-all'),
    path('documents/stats/',                   admin_documents_stats, name='admin-docs-stats'),
    path('documents/download/',                admin_document_download, name='admin-doc-download'),
    path('documents/rag-upload/',              admin_rag_upload,      name='admin-rag-upload'),
    path('documents/rag-list/',                admin_rag_list,        name='admin-rag-list'),
    path('documents/rag/<str:doc_id>/delete/', admin_rag_delete,      name='admin-rag-delete'),
    path('users/<int:user_id>/documents/',     admin_user_documents,  name='admin-user-docs'),
    path('documents/',                                AdminDocumentsListView.as_view(),                 name='admin-documents'),
]

# ─────────────────────────────────────────────────────────────────────────────
# BANK PATTERNS
# ─────────────────────────────────────────────────────────────────────────────
bank_urlpatterns = [
    path('dashboard/',                                bank_dashboard,                                   name='bank-dashboard'),
    path('clients/',                                  bank_clients_list,                                name='bank-clients'),
    path('clients/create/',                           bank_client_create,                               name='bank-client-create'),
    path('clients/<int:client_id>/',                  bank_client_detail,                               name='bank-client-detail'),
    path('clients/<int:client_id>/refresh-passport/', bank_client_refresh_passport,                    name='bank-client-refresh-passport'),
    path('clients/<int:client_id>/update/',           bank_client_update,                               name='bank-client-update'),
    path('enterprises/',                              bank_enterprises_list,                            name='bank-enterprises'),
    path('enterprises/create/',                       bank_enterprise_create,                           name='bank-enterprise-create'),
    path('enterprises/<int:enterprise_id>/',          bank_enterprise_detail,                           name='bank-enterprise-detail'),
    path('enterprises/<int:enterprise_id>/refresh-passport/', bank_enterprise_refresh_passport,       name='bank-enterprise-refresh-passport'),
    path('enterprises/<int:enterprise_id>/update/',   bank_enterprise_update,                           name='bank-enterprise-update'),
    path('products/',                                 bank_products_list,                               name='bank-products'),
    path('products/create/',                          bank_product_create,                              name='bank-product-create'),
    path('products/<int:prod_id>/',                   bank_product_detail,                              name='bank-product-detail'),
    path('products/<int:prod_id>/update/',            bank_product_update,                              name='bank-product-update'),
    path('products/<int:prod_id>/delete/',            bank_product_delete,                              name='bank-product-delete'),
    path('applications/',                             bank_applications_list,                           name='bank-applications'),
    path('applications/pending/',                     bank_applications_pending,                        name='bank-applications-pending'),
    path('applications/approved/',                    bank_applications_approved,                       name='bank-applications-approved'),
    path('applications/rejected/',                    bank_applications_rejected,                       name='bank-applications-rejected'),
    path('applications/submit/',                      bank_application_submit,                          name='bank-application-submit'),
    path('applications/<int:application_id>/',        bank_application_detail,                          name='bank-application-detail'),
    path('applications/<int:application_id>/review/', bank_application_review,                          name='bank-application-review'),
    path('applications/<int:app_id>/contract/',        generate_credit_contract,      name='bank-contract'),
    path('applications/<int:application_id>/update-amount/', bank_application_update_amount,            name='bank-application-update-amount'),
    path('simulator/',                                bank_simulator,                                   name='bank-simulator'),
    path('analytics/',                                bank_analytics,                                   name='bank-analytics'),
    path('ai/chat/',                                  bank_ai_chat,                                     name='bank-ai-chat'),
    path('send-message/',                             BankSendMessageView.as_view(),                    name='bank-send-message'),
    path('linked-accounts/',                                  list_linked_accounts,                   name='user-linked-accounts'),
    path('linked-accounts/add/',                              add_linked_account,                      name='user-linked-add'),
    path('linked-accounts/<int:account_id>/verify/',          verify_linked_account,                   name='user-linked-verify'),
    path('linked-accounts/<int:account_id>/sync/',            sync_linked_account,                     name='user-linked-sync'),
    path('linked-accounts/<int:account_id>/transactions/',    get_linked_account_transactions,          name='user-linked-txns'),
    path('linked-accounts/<int:account_id>/apply-to-score/',  apply_linked_transactions_to_score,      name='user-linked-apply'),
    path('linked-accounts/<int:account_id>/delete/',          delete_linked_account,                   name='user-linked-delete'),
    path('linked-accounts/<int:account_id>/set-primary/',     set_primary_account,                     name='user-linked-primary'),

    path('documents/upload/',                      bank_upload_document,   name='bank-doc-upload'),
    path('documents/list/',                        bank_list_documents,    name='bank-doc-list'),
    path('documents/<str:doc_id>/',                bank_document_detail,   name='bank-doc-detail'),
    path('documents/<str:doc_id>/delete/',         bank_delete_document,   name='bank-doc-delete'),
    path('documents/<str:doc_id>/download/',       bank_download_document, name='bank-doc-download'),
    path('documents/<str:doc_id>/analyze-credit/', bank_analyze_credit,    name='bank-doc-analyze'),
    path('clients/<int:client_id>/documents/',     bank_client_documents,  name='bank-client-docs'),
    path('client-documents/<int:document_id>/download/', bank_client_document_download, name='bank-client-doc-download'),
    path('client-documents/<int:document_id>/review/', bank_client_document_review, name='bank-client-doc-review'),
    path('send-enterprise-message/',                  BankSendEnterpriseMessageView.as_view(),          name='bank-send-enterprise-message'),
]

# ─────────────────────────────────────────────────────────────────────────────
# ENTERPRISE PATTERNS
# ─────────────────────────────────────────────────────────────────────────────
enterprise_urlpatterns = [
    # Employés
    path('employees/',                                enterprise_employees_list,                        name='enterprise-employees'),
    path('employees/create/',                         enterprise_employee_create,                       name='enterprise-employee-create'),
    path('employees/<int:emp_id>/',                   enterprise_employee_detail,                       name='enterprise-employee-detail'),
    path('employees/<int:emp_id>/link-teras/',        enterprise_employee_link_teras,                   name='enterprise-employee-link-teras'),
    # Équipe
    path('team/',                                     enterprise_team_list,                             name='enterprise-team'),
    path('team/invite/',                              enterprise_team_invite,                           name='enterprise-team-invite'),
    path('team/<int:member_id>/',                     enterprise_team_member,                           name='enterprise-team-member'),
    # Banque ↔ Entreprise
    path('bank-messages/',                            EnterpriseMessagesView.as_view(),                 name='enterprise-bank-messages'),
    path('bank-messages/<int:msg_id>/read/',          EnterpriseMarkMessageReadView.as_view(),          name='enterprise-bank-msg-read'),
    path('bank-messages/read-all/',                   EnterpriseMarkAllReadView.as_view(),              name='enterprise-bank-msg-read-all'),
    path('my-applications/',                          EnterpriseMyApplicationsView.as_view(),           name='enterprise-applications'),
    path('my-applications/request/',                  EnterpriseRequestApplicationView.as_view(),       name='enterprise-application-request'),
    path('my-applications/<int:application_id>/accept/', EnterpriseAcceptApplicationView.as_view(),    name='enterprise-application-accept'),
    path('my-applications/<int:application_id>/decline/', EnterpriseDeclineApplicationView.as_view(),  name='enterprise-application-decline'),
    path('products/',                                 EnterpriseProductsView.as_view(),                 name='enterprise-products'),
    path('bank-profile/',                             EnterpriseProfileBankView.as_view(),              name='enterprise-bank-profile'),
]

# ─────────────────────────────────────────────────────────────────────────────
# GOVERNMENT PATTERNS
# ─────────────────────────────────────────────────────────────────────────────
government_urlpatterns = [
    # Données réelles CEMAC
    path('overview/',                                 government_overview,                              name='gov-overview'),
    path('countries/<str:country_code>/',             government_country_detail,                        name='gov-country-detail'),
    path('regions/',                                  government_regions,                               name='gov-regions'),
    path('sectors/',                                  government_sectors_analysis,                      name='gov-sectors'),
    path('macro/',                                    government_macro_indicators,                      name='gov-macro'),
    path('users/map/',                                government_users_map,                             name='gov-users-map'),
    path('compliance/',                               government_compliance_alerts,                     name='gov-compliance'),
    path('ai-context/',                               government_ai_context,                            name='gov-ai-context'),
    # IA enrichie
    path('linked-accounts/',                                  list_linked_accounts,                   name='user-linked-accounts'),
    path('linked-accounts/add/',                              add_linked_account,                      name='user-linked-add'),
    path('linked-accounts/<int:account_id>/verify/',          verify_linked_account,                   name='user-linked-verify'),
    path('linked-accounts/<int:account_id>/sync/',            sync_linked_account,                     name='user-linked-sync'),
    path('linked-accounts/<int:account_id>/transactions/',    get_linked_account_transactions,          name='user-linked-txns'),
    path('linked-accounts/<int:account_id>/apply-to-score/',  apply_linked_transactions_to_score,      name='user-linked-apply'),
    path('linked-accounts/<int:account_id>/delete/',          delete_linked_account,                   name='user-linked-delete'),
    path('linked-accounts/<int:account_id>/set-primary/',     set_primary_account,                     name='user-linked-primary'),

    path('documents/upload/',                government_upload_document,   name='gov-doc-upload'),
    path('documents/list/',                  government_list_documents,     name='gov-doc-list'),
    path('documents/<str:doc_id>/',          government_document_detail,    name='gov-doc-detail'),
    path('documents/<str:doc_id>/delete/',   government_delete_document,    name='gov-doc-delete'),
    path('documents/<str:doc_id>/download/', government_download_document,  name='gov-doc-download'),
    path('documents/<str:doc_id>/analyze/',  government_analyze_document,   name='gov-doc-analyze'),
    path('reports/generate-enriched/',                government_report_generate_enriched,              name='gov-report-enriched'),
    path('ai-chat/',                                  government_ai_chat_enriched,                      name='gov-ai-chat'),
    # Legacy
    path('dashboard/',                                government_dashboard,                             name='gov-dashboard'),
    path('regions/list/',                             government_regions_list,                          name='gov-regions-list'),
    path('regions/<int:region_id>/',                  government_region_detail,                         name='gov-region-detail'),
    path('sectors/list/',                             government_sectors_list,                          name='gov-sectors-list'),
    path('sectors/<int:sector_id>/',                  government_sector_detail,                         name='gov-sector-detail'),
    path('analytics/trends/',                         government_analytics_trends,                      name='gov-analytics-trends'),
    path('analytics/comparison/',                     government_analytics_comparison,                  name='gov-analytics-comparison'),
    path('alerts/',                                   government_alerts_list,                           name='gov-alerts'),
    path('alerts/<int:alert_id>/',                    government_alert_detail,                          name='gov-alert-detail'),
    path('alerts/create/',                            government_alert_create,                          name='gov-alert-create'),
    path('alerts/<int:alert_id>/status/',             government_alert_update_status,                   name='gov-alert-status'),
    path('reports/',                                  government_reports_list,                          name='gov-reports'),
    path('reports/<int:report_id>/',                  government_report_detail,                         name='gov-report-detail'),
    path('reports/generate/',                         government_report_generate,                       name='gov-report-generate'),
    path('reports/<int:report_id>/download/',         government_report_download,                       name='gov-report-download'),
    path('settings/',                                 government_settings_get,                          name='gov-settings'),
    path('settings/update/',                          government_settings_update,                       name='gov-settings-update'),
]

# ─────────────────────────────────────────────────────────────────────────────
# URLPATTERNS PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────────

staff_urlpatterns = [
    path('staff/list/',                           list_staff,                  name='staff-list'),
    path('staff/invite/',                         invite_staff,                name='staff-invite'),
    path('staff/my-access/',                      get_my_staff_access,         name='staff-my-access'),
    path('staff/<int:member_id>/permissions/',    update_staff_permissions,    name='staff-permissions'),
    path('staff/<int:member_id>/remove/',         remove_staff,                name='staff-remove'),
]

urlpatterns = [
    path('user/',        include((user_urlpatterns,       'user'))),
    path('admin/',       include((admin_urlpatterns,      'admin'))),
    path('bank/',        include((bank_urlpatterns,       'bank'))),
    path('enterprise/',  include((enterprise_urlpatterns, 'enterprise'))),
    path('government/',  include((government_urlpatterns, 'government'))),
    path('', include(staff_urlpatterns)),
]
