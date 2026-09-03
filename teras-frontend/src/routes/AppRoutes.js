import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/routes/AppRoutes.tsx — VERSION FINALE COMPLÈTE
import { Routes, Route, Navigate } from "react-router-dom";
// Pages publiques
import HomePage from "../pages/public/HomePage";
import PreviewDashboard from "../pages/public/PreviewDashboard";
import ScoreCreditPage from "../pages/public/ScoreCreditPage";
import ApiDocsPage from "../pages/public/ApiDocsPage";
import ContactPage from "../pages/public/ContactPage";
// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import RegisterPendingPage from "../pages/auth/RegisterPendingPage";
import RoleBasedRedirect from "./RoleBasedRedirect";
// User
import MonEspace from "../pages/user/MonEspace";
import UserDashboard from "../pages/user/UserDashboard";
import Simulateurs from "../pages/user/Simulateurs";
import ComputeScore from "../pages/user/ComputeScore";
import HistoryPage from "../pages/user/HistoryPage";
import UserDocuments from "../pages/user/UserDocuments";
import UserProfile from "../pages/user/UserProfile";
import UserSettings from "../pages/user/UserSettings";
import ChatHistory from "../pages/user/ChatHistory";
import KYC from "../pages/user/KYC";
import UserHelp from "../pages/user/UserHelp";
import UserSupport from "../pages/user/UserSupport";
import ImprovePage from "../pages/user/ImprovePage";
import CreditScoreInfo from "../pages/user/CreditScoreInfo";
import UserBankMessages from "../pages/user/UserBankMessages";
// Enterprise
import EnterpriseDashboard from "../pages/enterprise/EnterpriseDashboard";
import EnterpriseAssistant from "../pages/enterprise/EnterpriseAssistant";
import EnterpriseDocuments from "../pages/enterprise/EnterpriseDocuments";
import EnterpriseEmployees from "../pages/enterprise/EnterpriseEmployees";
import EnterpriseReports from "../pages/enterprise/EnterpriseReports";
import EnterpriseNotifications from "../pages/enterprise/EnterpriseNotifications";
import EnterpriseCompliance from "../pages/enterprise/EnterpriseCompliance";
import EnterpriseProfile from "../pages/enterprise/EnterpriseProfile";
import EnterpriseSettings from "../pages/enterprise/EnterpriseSettings";
import EnterpriseClientsList from "../pages/enterprise/EnterpriseClientsList";
import EnterpriseClientDetail from "../pages/enterprise/EnterpriseClientDetail";
import EnterpriseNewCase from "../pages/enterprise/EnterpriseNewCase";
import EnterpriseSupport from "../pages/enterprise/EnterpriseSupport";
import EnterpriseTransactions from "../pages/enterprise/EnterpriseTransactions";
import EnterpriseFinance from "../pages/enterprise/EnterpriseFinance";
// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminUserDetails from "../pages/admin/AdminUserDetails";
import AdminValidation from "../pages/admin/AdminValidation";
import AdminDataAnalytics from "../pages/admin/AdminDataAnalytics";
import AdminActivityMonitor from "../pages/admin/AdminActivityMonitor";
import AdminSupport from "../pages/admin/AdminSupport";
import AdminAIChat from "../pages/admin/AdminAIChat";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminSettings from "../pages/admin/AdminSettings";
import AdminLegislation from "../pages/admin/AdminLegislation";
import AdminUserEdit from "../pages/admin/AdminUserEdit";
import AdminDocumentUpload from "../pages/admin/AdminDocumentUpload";
import AdminDocumentViewer from "../pages/admin/AdminDocumentViewer";
import AdminDocuments from "../pages/admin/AdminDocuments";
import AdminKYC from "../pages/admin/AdminKYC";
import RAGChat from "../components/admin/RAGChat";
import RAGAnalytics from "../components/admin/RAGAnalytics";
// Government
import GovernmentDashboard from "../pages/government/GovernmentDashboard";
import GovernmentRegions from "../pages/government/GovernmentRegions";
import GovernmentSectors from "../pages/government/GovernmentSectors";
import GovernmentAlerts from "../pages/government/GovernmentAlerts";
import GovernmentDocuments from "../pages/government/GovernmentDocuments";
import GovernmentReports from "../pages/government/GovernmentReports";
import GovernmentSettings from "../pages/government/GovernmentSettings";
import TerasGovernmentChat from "../components/government/TerasGovernmentChat";
// Bank
import BankDashboard from "../pages/bank/BankDashboard";
import BankClients from "../pages/bank/BankClients";
import BankClientDetail from "../pages/bank/BankClientDetail";
import BankClientNew from "../pages/bank/BankClientNew";
import BankEnterprises from "../pages/bank/BankEnterprises";
import BankEnterpriseDetail from "../pages/bank/BankEnterpriseDetail";
import BankEnterpriseNew from "../pages/bank/BankEnterpriseNew";
import BankProducts from "../pages/bank/BankProducts";
import BankApplicationsPending from "../pages/bank/BankApplicationsPending";
import BankApplicationsApproved from "../pages/bank/BankApplicationsApproved";
import BankApplicationsRejected from "../pages/bank/BankApplicationsRejected";
import BankAnalytics from "../pages/bank/BankAnalytics";
import BankPortfolio from "../pages/bank/BankPortfolio";
import BankChat from "../pages/bank/BankChat";
import BankSettings from "../pages/bank/BankSettings";
import BankDocuments from "../pages/bank/BankDocuments";
import BankSimulator from "../pages/bank/BankSimulator";
// Layouts
import Navbar from "../components/Navbar";
import EnterpriseLayout from "../layouts/EnterpriseLayout";
import AdminLayout from "../components/AdminLayout";
import GovernmentLayout from "../components/government/GovernmentLayout";
import BankLayout from "../layouts/BankLayout";
// Route Guards
import ProtectedRoute, { AdminRoute } from "./ProtectedRoute";
import GuestOnlyRoute from "./GuestOnlyRoute";
const LayoutWithNavbar = ({ children }) => (_jsx(Navbar, { children: children }));
export default function AppRoutes() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/preview", element: _jsx(PreviewDashboard, {}) }), _jsx(Route, { path: "/score-credit", element: _jsx(ScoreCreditPage, {}) }), _jsx(Route, { path: "/score-credit-info", element: _jsx(CreditScoreInfo, {}) }), _jsx(Route, { path: "/api-docs", element: _jsx(ApiDocsPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(ContactPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(GuestOnlyRoute, { children: _jsx(Login, {}) }) }), _jsx(Route, { path: "/register", element: _jsx(GuestOnlyRoute, { children: _jsx(Register, {}) }) }), _jsx(Route, { path: "/register/pending", element: _jsx(RegisterPendingPage, {}) }), _jsx(Route, { path: "/redirect", element: _jsx(ProtectedRoute, { children: _jsx(RoleBasedRedirect, {}) }) }), _jsx(Route, { path: "/mon-espace", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(MonEspace, {}) }) }) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(UserDashboard, {}) }) }) }), _jsx(Route, { path: "/simulateurs", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(Simulateurs, {}) }) }) }), _jsx(Route, { path: "/calcul-score", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(ComputeScore, {}) }) }) }), _jsx(Route, { path: "/historique", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(HistoryPage, {}) }) }) }), _jsx(Route, { path: "/documents", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(UserDocuments, {}) }) }) }), _jsx(Route, { path: "/profil", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(UserProfile, {}) }) }) }), _jsx(Route, { path: "/kyc", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(KYC, {}) }) }) }), _jsx(Route, { path: "/parametres", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(UserSettings, {}) }) }) }), _jsx(Route, { path: "/chat-history", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(ChatHistory, {}) }) }) }), _jsx(Route, { path: "/credit", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(Navigate, { to: "/mes-messages", replace: true, state: { openTab: "credits" } }) }) }), _jsx(Route, { path: "/ameliorer", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(ImprovePage, {}) }) }) }), _jsx(Route, { path: "/aide", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(UserHelp, {}) }) }) }), _jsx(Route, { path: "/support", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(UserSupport, {}) }) }) }), _jsx(Route, { path: "/mes-messages", element: _jsx(ProtectedRoute, { allowedTypes: ['individual', 'admin'], children: _jsx(LayoutWithNavbar, { children: _jsx(UserBankMessages, {}) }) }) }), _jsxs(Route, { path: "/enterprise", element: _jsx(ProtectedRoute, { allowedTypes: ['enterprise', 'admin'], children: _jsx(EnterpriseLayout, {}) }), children: [_jsx(Route, { path: "dashboard", element: _jsx(EnterpriseDashboard, {}) }), _jsx(Route, { path: "assistant", element: _jsx(EnterpriseAssistant, {}) }), _jsx(Route, { path: "documents", element: _jsx(EnterpriseDocuments, {}) }), _jsx(Route, { path: "employees", element: _jsx(EnterpriseEmployees, {}) }), _jsx(Route, { path: "reports", element: _jsx(EnterpriseReports, {}) }), _jsx(Route, { path: "notifications", element: _jsx(EnterpriseNotifications, {}) }), _jsx(Route, { path: "compliance", element: _jsx(EnterpriseCompliance, {}) }), _jsx(Route, { path: "profile", element: _jsx(EnterpriseProfile, {}) }), _jsx(Route, { path: "settings", element: _jsx(EnterpriseSettings, {}) }), _jsx(Route, { path: "clients", element: _jsx(EnterpriseClientsList, {}) }), _jsx(Route, { path: "clients/:id", element: _jsx(EnterpriseClientDetail, {}) }), _jsx(Route, { path: "new-case", element: _jsx(EnterpriseNewCase, {}) }), _jsx(Route, { path: "support", element: _jsx(EnterpriseSupport, {}) }), _jsx(Route, { path: "transactions", element: _jsx(EnterpriseTransactions, {}) }), _jsx(Route, { path: "finance", element: _jsx(EnterpriseFinance, {}) }), _jsx(Route, { index: true, element: _jsx(Navigate, { to: "dashboard", replace: true }) })] }), _jsxs(Route, { path: "/admin", element: _jsx(AdminRoute, { children: _jsx(AdminLayout, {}) }), children: [_jsx(Route, { path: "dashboard", element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "users", element: _jsx(AdminUsers, {}) }), _jsx(Route, { path: "users/:id", element: _jsx(AdminUserDetails, {}) }), _jsx(Route, { path: "users/:id/edit", element: _jsx(AdminUserEdit, {}) }), _jsx(Route, { path: "kyc", element: _jsx(AdminKYC, {}) }), _jsx(Route, { path: "validation", element: _jsx(AdminValidation, {}) }), _jsx(Route, { path: "documents", element: _jsx(AdminDocuments, {}) }), _jsx(Route, { path: "documents/:id", element: _jsx(AdminDocumentViewer, {}) }), _jsx(Route, { path: "upload", element: _jsx(AdminDocumentUpload, {}) }), _jsx(Route, { path: "legislation", element: _jsx(AdminLegislation, {}) }), _jsx(Route, { path: "analytics", element: _jsx(AdminDataAnalytics, {}) }), _jsx(Route, { path: "monitor", element: _jsx(AdminActivityMonitor, {}) }), _jsx(Route, { path: "support", element: _jsx(AdminSupport, {}) }), _jsx(Route, { path: "ai-chat", element: _jsx(AdminAIChat, {}) }), _jsx(Route, { path: "rag-chat", element: _jsx(RAGChat, {}) }), _jsx(Route, { path: "rag-analytics", element: _jsx(RAGAnalytics, {}) }), _jsx(Route, { path: "profile", element: _jsx(AdminProfile, {}) }), _jsx(Route, { path: "settings", element: _jsx(AdminSettings, {}) }), _jsx(Route, { index: true, element: _jsx(Navigate, { to: "dashboard", replace: true }) })] }), _jsxs(Route, { path: "/government", element: _jsx(ProtectedRoute, { allowedTypes: ['government', 'regional', 'admin'], children: _jsx(GovernmentLayout, {}) }), children: [_jsx(Route, { path: "dashboard", element: _jsx(GovernmentDashboard, {}) }), _jsx(Route, { path: "regions", element: _jsx(GovernmentRegions, {}) }), _jsx(Route, { path: "sectors", element: _jsx(GovernmentSectors, {}) }), _jsx(Route, { path: "alerts", element: _jsx(GovernmentAlerts, {}) }), _jsx(Route, { path: "documents", element: _jsx(GovernmentDocuments, {}) }), _jsx(Route, { path: "reports", element: _jsx(GovernmentReports, {}) }), _jsx(Route, { path: "assistant", element: _jsx(TerasGovernmentChat, {}) }), _jsx(Route, { path: "settings", element: _jsx(GovernmentSettings, {}) }), _jsx(Route, { index: true, element: _jsx(Navigate, { to: "dashboard", replace: true }) })] }), _jsxs(Route, { path: "/bank", element: _jsx(ProtectedRoute, { allowedTypes: ['bank', 'admin'], children: _jsx(BankLayout, {}) }), children: [_jsx(Route, { path: "dashboard", element: _jsx(BankDashboard, {}) }), _jsx(Route, { path: "clients", element: _jsx(BankClients, {}) }), _jsx(Route, { path: "clients/new", element: _jsx(BankClientNew, {}) }), _jsx(Route, { path: "clients/:id", element: _jsx(BankClientDetail, {}) }), _jsx(Route, { path: "enterprises", element: _jsx(BankEnterprises, {}) }), _jsx(Route, { path: "enterprises/new", element: _jsx(BankEnterpriseNew, {}) }), _jsx(Route, { path: "enterprises/:id", element: _jsx(BankEnterpriseDetail, {}) }), _jsx(Route, { path: "products", element: _jsx(BankProducts, {}) }), _jsx(Route, { path: "products/create", element: _jsx(BankSimulator, {}) }), _jsx(Route, { path: "applications/pending", element: _jsx(BankApplicationsPending, {}) }), _jsx(Route, { path: "applications/approved", element: _jsx(BankApplicationsApproved, {}) }), _jsx(Route, { path: "applications/rejected", element: _jsx(BankApplicationsRejected, {}) }), _jsx(Route, { path: "portfolio", element: _jsx(BankPortfolio, {}) }), _jsx(Route, { path: "analytics", element: _jsx(BankAnalytics, {}) }), _jsx(Route, { path: "simulator", element: _jsx(BankSimulator, {}) }), _jsx(Route, { path: "chat", element: _jsx(BankChat, {}) }), _jsx(Route, { path: "documents", element: _jsx(BankDocuments, {}) }), _jsx(Route, { path: "settings", element: _jsx(BankSettings, {}) }), _jsx(Route, { index: true, element: _jsx(Navigate, { to: "dashboard", replace: true }) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
