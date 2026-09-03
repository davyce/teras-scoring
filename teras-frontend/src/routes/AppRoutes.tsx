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

const LayoutWithNavbar = ({ children }: { children: React.ReactNode }) => (
  <Navbar>{children}</Navbar>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── PUBLIQUES ────────────────────────────────────────────────── */}
      <Route path="/"                element={<HomePage />} />
      <Route path="/preview"         element={<PreviewDashboard />} />
      <Route path="/score-credit"    element={<ScoreCreditPage />} />
      <Route path="/score-credit-info" element={<CreditScoreInfo />} />
      <Route path="/api-docs"        element={<ApiDocsPage />} />
      <Route path="/contact"         element={<ContactPage />} />

      {/* ── AUTH ─────────────────────────────────────────────────────── */}
      <Route path="/login"    element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route path="/register/pending" element={<RegisterPendingPage />} />
      <Route path="/redirect" element={<ProtectedRoute><RoleBasedRedirect /></ProtectedRoute>} />

      {/* ── USER ─────────────────────────────────────────────────────── */}
      <Route path="/mon-espace"   element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><MonEspace /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/dashboard"    element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><UserDashboard /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/simulateurs"  element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><Simulateurs /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/calcul-score" element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><ComputeScore /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/historique"   element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><HistoryPage /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/documents"    element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><UserDocuments /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/profil"       element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><UserProfile /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/kyc"          element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><KYC /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/parametres"   element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><UserSettings /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/chat-history" element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><ChatHistory /></LayoutWithNavbar></ProtectedRoute>} />
      <Route
        path="/credit"
        element={
          <ProtectedRoute allowedTypes={['individual', 'admin']}>
            <Navigate to="/mes-messages" replace state={{ openTab: "credits" }} />
          </ProtectedRoute>
        }
      />
      <Route path="/ameliorer"    element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><ImprovePage /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/aide"         element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><UserHelp /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/support"      element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><UserSupport /></LayoutWithNavbar></ProtectedRoute>} />
      <Route path="/mes-messages" element={<ProtectedRoute allowedTypes={['individual','admin']}><LayoutWithNavbar><UserBankMessages /></LayoutWithNavbar></ProtectedRoute>} />

      {/* ── ENTERPRISE ───────────────────────────────────────────────── */}
      <Route path="/enterprise" element={<ProtectedRoute allowedTypes={['enterprise','admin']}><EnterpriseLayout /></ProtectedRoute>}>
        <Route path="dashboard"      element={<EnterpriseDashboard />} />
        <Route path="assistant"      element={<EnterpriseAssistant />} />
        <Route path="documents"      element={<EnterpriseDocuments />} />
        <Route path="employees"      element={<EnterpriseEmployees />} />
        <Route path="reports"        element={<EnterpriseReports />} />
        <Route path="notifications"  element={<EnterpriseNotifications />} />
        <Route path="compliance"     element={<EnterpriseCompliance />} />
        <Route path="profile"        element={<EnterpriseProfile />} />
        <Route path="settings"       element={<EnterpriseSettings />} />
        <Route path="clients"        element={<EnterpriseClientsList />} />
        <Route path="clients/:id"    element={<EnterpriseClientDetail />} />
        <Route path="new-case"       element={<EnterpriseNewCase />} />
        <Route path="support"        element={<EnterpriseSupport />} />
        <Route path="transactions"   element={<EnterpriseTransactions />} />
        <Route path="finance"        element={<EnterpriseFinance />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── ADMIN ────────────────────────────────────────────────────── */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="dashboard"        element={<AdminDashboard />} />
        <Route path="users"            element={<AdminUsers />} />
        <Route path="users/:id"        element={<AdminUserDetails />} />
        <Route path="users/:id/edit"   element={<AdminUserEdit />} />
        <Route path="kyc"              element={<AdminKYC />} />
        <Route path="validation"       element={<AdminValidation />} />
        <Route path="documents"        element={<AdminDocuments />} />
        <Route path="documents/:id"    element={<AdminDocumentViewer />} />
        <Route path="upload"           element={<AdminDocumentUpload />} />
        <Route path="legislation"      element={<AdminLegislation />} />
        <Route path="analytics"        element={<AdminDataAnalytics />} />
        <Route path="monitor"          element={<AdminActivityMonitor />} />
        <Route path="support"          element={<AdminSupport />} />
        <Route path="ai-chat"          element={<AdminAIChat />} />
        <Route path="rag-chat"         element={<RAGChat />} />
        <Route path="rag-analytics"    element={<RAGAnalytics />} />
        <Route path="profile"          element={<AdminProfile />} />
        <Route path="settings"         element={<AdminSettings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── GOVERNMENT ───────────────────────────────────────────────── */}
      <Route path="/government" element={<ProtectedRoute allowedTypes={['government','regional','admin']}><GovernmentLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<GovernmentDashboard />} />
        <Route path="regions"   element={<GovernmentRegions />} />
        <Route path="sectors"   element={<GovernmentSectors />} />
        <Route path="alerts"    element={<GovernmentAlerts />} />
        <Route path="documents" element={<GovernmentDocuments />} />
        <Route path="reports"   element={<GovernmentReports />} />
        <Route path="assistant" element={<TerasGovernmentChat />} />
        <Route path="settings"  element={<GovernmentSettings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── BANK ─────────────────────────────────────────────────────── */}
      <Route path="/bank" element={<ProtectedRoute allowedTypes={['bank','admin']}><BankLayout /></ProtectedRoute>}>
        <Route path="dashboard"               element={<BankDashboard />} />
        <Route path="clients"                 element={<BankClients />} />
        <Route path="clients/new"             element={<BankClientNew />} />
        <Route path="clients/:id"             element={<BankClientDetail />} />
        <Route path="enterprises"             element={<BankEnterprises />} />
        <Route path="enterprises/new"         element={<BankEnterpriseNew />} />
        <Route path="enterprises/:id"         element={<BankEnterpriseDetail />} />
        <Route path="products"                element={<BankProducts />} />
        <Route path="products/create"         element={<BankSimulator />} />
        <Route path="applications/pending"    element={<BankApplicationsPending />} />
        <Route path="applications/approved"   element={<BankApplicationsApproved />} />
        <Route path="applications/rejected"   element={<BankApplicationsRejected />} />
        <Route path="portfolio"               element={<BankPortfolio />} />
        <Route path="analytics"               element={<BankAnalytics />} />
        <Route path="simulator"               element={<BankSimulator />} />
        <Route path="chat"                    element={<BankChat />} />
        <Route path="documents"              element={<BankDocuments />} />
        <Route path="settings"               element={<BankSettings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ── 404 ──────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
