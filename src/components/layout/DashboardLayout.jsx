import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import {
  LayoutDashboard,
  Building2,
  Clock,
  CreditCard,
  Package,
  Users,
  Shield,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronLeft,
  UserPlus,
  TrendingUp,
  UserCog,
  UsersRound,
  UserCheck,
  KeyRound,
  AppWindow,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Super Admin navigation items
const superAdminNavItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/pending-organizations", icon: Clock, label: "Pending Requests" },
  { path: "/organizations", icon: Building2, label: "Organizations" },
  { path: "/admins", icon: UserCog, label: "Admin Accounts" },
  { path: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { path: "/upgrade-requests", icon: TrendingUp, label: "Upgrade Requests" },
  { path: "/individual-requests", icon: UserCheck, label: "Individual Requests" },
  { path: "/plans", icon: Package, label: "Product Plans" },
  { path: "/users", icon: Users, label: "Users" },
  { path: "/roles", icon: Shield, label: "Roles" },
  { path: "/billing", icon: Receipt, label: "Billing" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
  { path: "/zitadel-test", icon: KeyRound, label: "Zitadel Test" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

// Org Admin navigation items
const orgAdminNavItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/my-organization", icon: Building2, label: "Organization" },
  { path: "/my-team", icon: UsersRound, label: "Organization Admins" },
  { path: "/onboard-bu", icon: Building2, label: "Onboard Business unit" },
  { path: "/onboard-project", icon: Package, label: "Onboard Project" },
  { path: "/onboard-application", icon: AppWindow, label: "Onboard Application" },
  { path: "/my-users", icon: Users, label: "My Users" },
  { path: "/my-user-requests", icon: UserPlus, label: "User Requests" },
  { path: "/my-subscription", icon: CreditCard, label: "Subscription" },
  { path: "/my-billing", icon: Receipt, label: "Billing" },
  { path: "/request-upgrade", icon: TrendingUp, label: "Request Upgrade" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const { admin, logout, isSuperAdmin, isOrgAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Select nav items based on role
  const navItems = isSuperAdmin ? superAdminNavItems : orgAdminNavItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavItem = ({ item, mobile = false }) => (
    <NavLink
      to={item.path}
      onClick={() => mobile && setMobileMenuOpen(false)}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-primary/10 text-primary border-l-2 border-primary"
            : "text-muted-foreground"
        )
      }
    >
      <item.icon className="h-4 w-4 flex-shrink-0" />
      {(sidebarOpen || mobile) && <span>{item.label}</span>}
    </NavLink>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background" data-testid="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/admin/favicon.png" alt="Probestack Logo" className="h-8 w-8 rounded-lg" />
              <span className="font-semibold text-lg gradient-text">ProbeStack</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
            data-testid="sidebar-toggle"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* User section */}
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2" data-testid="user-menu-trigger">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[140px]">{admin?.name || "Admin"}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">{admin?.email}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-card transform transition-transform duration-300 md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/admin/favicon.png" alt="Probestack Logo" className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-lg gradient-text">ProbeStack</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {/* Mobile Role Badge */}
        <div className="px-4 py-3 border-b border-border">
          <Badge
            variant="outline"
            className={cn(
              "w-full justify-center py-1",
              isSuperAdmin ? "bg-red-500/10 text-red-600 border-red-200" : "bg-blue-500/10 text-blue-600 border-blue-200"
            )}
          >
            {isSuperAdmin ? "Super Admin" : "Org Admin"}
          </Badge>
          {isOrgAdmin && admin?.organization_name && (
            <p className="text-xs text-muted-foreground text-center mt-1 truncate">
              {admin.organization_name}
            </p>
          )}
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} mobile />
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6" data-testid="header">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            data-testid="mobile-menu-trigger"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              data-testid="theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/notifications")}
                className="h-9 w-9 relative"
                data-testid="notifications-btn"
              >
                <Bell className="h-4 w-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" data-testid="mobile-user-menu">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {admin?.name?.charAt(0)?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{admin?.name || "Admin"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
