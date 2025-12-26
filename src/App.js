import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

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

// Org Admin Pages
import MyDashboardPage from "./pages/MyDashboardPage";
import MyUsersPage from "./pages/MyUsersPage";
import MyUserRequestsPage from "./pages/MyUserRequestsPage";
import MySubscriptionPage from "./pages/MySubscriptionPage";
import MyBillingPage from "./pages/MyBillingPage";
import RequestUpgradePage from "./pages/RequestUpgradePage";
import MyTeamPage from "./pages/MyTeamPage";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Route guard for Super Admin only routes - returns null for loading to prevent flicker
const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return null; // Parent already shows loading
  }
  
  // If not authenticated, ProtectedRoute will handle redirect
  if (!isAuthenticated) {
    return null;
  }
  
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Route guard for Org Admin only routes
const OrgAdminRoute = ({ children }) => {
  const { isOrgAdmin, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return null; // Parent already shows loading
  }
  
  // If not authenticated, ProtectedRoute will handle redirect
  if (!isAuthenticated) {
    return null;
  }
  
  if (!isOrgAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Dynamic dashboard component that renders based on role
const DynamicDashboard = () => {
  const { isSuperAdmin, loading } = useAuth();
  
  if (loading) {
    return null;
  }
  
  return isSuperAdmin ? <DashboardPage /> : <MyDashboardPage />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Dashboard - renders different content based on role */}
        <Route index element={<DynamicDashboard />} />
        
        {/* Super Admin Only Routes */}
        <Route path="pending-organizations" element={<SuperAdminRoute><PendingOrganizationsPage /></SuperAdminRoute>} />
        <Route path="organizations" element={<SuperAdminRoute><OrganizationsPage /></SuperAdminRoute>} />
        <Route path="subscriptions" element={<SuperAdminRoute><SubscriptionsPage /></SuperAdminRoute>} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="users" element={<SuperAdminRoute><UsersPage /></SuperAdminRoute>} />
        <Route path="roles" element={<SuperAdminRoute><RolesPage /></SuperAdminRoute>} />
        <Route path="billing" element={<SuperAdminRoute><BillingPage /></SuperAdminRoute>} />
        <Route path="notifications" element={<SuperAdminRoute><NotificationsPage /></SuperAdminRoute>} />
        <Route path="upgrade-requests" element={<SuperAdminRoute><UpgradeRequestsPage /></SuperAdminRoute>} />
        <Route path="admins" element={<SuperAdminRoute><AdminsPage /></SuperAdminRoute>} />
        
        {/* Org Admin Only Routes */}
        <Route path="my-users" element={<OrgAdminRoute><MyUsersPage /></OrgAdminRoute>} />
        <Route path="my-user-requests" element={<OrgAdminRoute><MyUserRequestsPage /></OrgAdminRoute>} />
        <Route path="my-subscription" element={<OrgAdminRoute><MySubscriptionPage /></OrgAdminRoute>} />
        <Route path="my-billing" element={<OrgAdminRoute><MyBillingPage /></OrgAdminRoute>} />
        <Route path="request-upgrade" element={<OrgAdminRoute><RequestUpgradePage /></OrgAdminRoute>} />
        <Route path="my-team" element={<OrgAdminRoute><MyTeamPage /></OrgAdminRoute>} />
        
        {/* Shared Routes */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
