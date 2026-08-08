import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import IndividualRequestsPage from "./pages/IndividualRequestsPage";

// Super Admin Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PendingOrganizationsPage from "./pages/PendingOrganizationsPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import PlansPage from "./pages/PlansPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import BillingPage from "./pages/BillingPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import UpgradeRequestsPage from "./pages/UpgradeRequestsPage";
import AdminsPage from "./pages/AdminsPage";
import ZitadelTestPage from "./pages/ZitadelTestPage";

// Org Admin Pages
import MyDashboardPage from "./pages/MyDashboardPage";
import MyUsersPage from "./pages/MyUsersPage";
import MyUserRequestsPage from "./pages/MyUserRequestsPage";
import MySubscriptionPage from "./pages/MySubscriptionPage";
import MyBillingPage from "./pages/MyBillingPage";
import RequestUpgradePage from "./pages/RequestUpgradePage";
import MyTeamPage from "./pages/MyTeamPage";
import MyOrganizationPage from "./pages/MyOrganizationPage";
import MyBusinessUnitsPage from "./pages/MyBusinessUnitsPage";
import MyProjectsPage from "./pages/MyProjectsPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import MyProjectTeamPage from "./pages/MyProjectTeamPage";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

/* -------------------- ROUTE GUARDS -------------------- */

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="login" replace />;
  }

  return <Outlet />;
};

const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin, loading, isAuthenticated } = useAuth();

  if (loading || !isAuthenticated) return null;
  if (!isSuperAdmin) return <Navigate to="." replace />;

  return children;
};

const OrgAdminRoute = ({ children }) => {
  const { isOrgAdmin, loading, isAuthenticated } = useAuth();

  if (loading || !isAuthenticated) return null;
  if (!isOrgAdmin) return <Navigate to="." replace />;

  return children;
};

/* -------------------- DASHBOARD SELECTOR -------------------- */

const DynamicDashboard = () => {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  return isSuperAdmin ? <DashboardPage /> : <MyDashboardPage />;
};

/* -------------------- ROUTES -------------------- */

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="login" element={<LoginPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DynamicDashboard />} />

          {/* Super Admin */}
          <Route path="pending-organizations" element={<SuperAdminRoute><PendingOrganizationsPage /></SuperAdminRoute>} />
          <Route path="organizations" element={<SuperAdminRoute><OrganizationsPage /></SuperAdminRoute>} />
          <Route path="subscriptions" element={<SuperAdminRoute><SubscriptionsPage /></SuperAdminRoute>} />
          <Route path="users" element={<SuperAdminRoute><UsersPage /></SuperAdminRoute>} />
          <Route path="roles" element={<SuperAdminRoute><RolesPage /></SuperAdminRoute>} />
          <Route path="billing" element={<SuperAdminRoute><BillingPage /></SuperAdminRoute>} />
          <Route path="notifications" element={<SuperAdminRoute><NotificationsPage /></SuperAdminRoute>} />
          <Route path="upgrade-requests" element={<SuperAdminRoute><UpgradeRequestsPage /></SuperAdminRoute>} />
          <Route path="admins" element={<SuperAdminRoute><AdminsPage /></SuperAdminRoute>} />
          <Route path="individual-requests" element={<SuperAdminRoute><IndividualRequestsPage /></SuperAdminRoute>} />
          <Route path="zitadel-test" element={<SuperAdminRoute><ZitadelTestPage /></SuperAdminRoute>} />

          {/* Org Admin */}
          <Route path="my-users" element={<OrgAdminRoute><MyUsersPage /></OrgAdminRoute>} />
          <Route path="my-user-requests" element={<OrgAdminRoute><MyUserRequestsPage /></OrgAdminRoute>} />
          <Route path="my-subscription" element={<OrgAdminRoute><MySubscriptionPage /></OrgAdminRoute>} />
          <Route path="my-billing" element={<OrgAdminRoute><MyBillingPage /></OrgAdminRoute>} />
          <Route path="request-upgrade" element={<OrgAdminRoute><RequestUpgradePage /></OrgAdminRoute>} />
          <Route path="my-team" element={<OrgAdminRoute><MyTeamPage /></OrgAdminRoute>} />
          <Route path="my-organization" element={<OrgAdminRoute><MyOrganizationPage /></OrgAdminRoute>} />
          <Route path="onboard-bu" element={<OrgAdminRoute><MyBusinessUnitsPage /></OrgAdminRoute>} />
          <Route path="onboard-project" element={<OrgAdminRoute><MyProjectsPage /></OrgAdminRoute>} />
          <Route path="onboard-application" element={<OrgAdminRoute><MyApplicationsPage /></OrgAdminRoute>} />
          <Route path="onboard-project/:projectId/team" element={<OrgAdminRoute><MyProjectTeamPage /></OrgAdminRoute>} />

          {/* Shared */}
          <Route path="plans" element={<PlansPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

/* -------------------- APP ROOT -------------------- */

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename="/admin">
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
