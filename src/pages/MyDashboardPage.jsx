import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  Users,
  CreditCard,
  Shield,
  Receipt,
  ArrowRight,
  UserPlus,
  TrendingUp,
} from "lucide-react";

export default function MyDashboardPage() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await myOrganizationApi.getDashboard();
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.total_users || 0,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      action: () => navigate("/my-users"),
    },
    {
      title: "Pending User Requests",
      value: stats?.pending_user_requests || 0,
      icon: UserPlus,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      action: () => navigate("/my-user-requests"),
    },
    {
      title: "Active Subscription",
      value: stats?.subscription ? stats.subscription.plan_name : "None",
      icon: CreditCard,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      action: () => navigate("/my-subscription"),
    },
    {
      title: "Total Roles",
      value: stats?.total_roles || 0,
      icon: Shield,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Total Billed",
      value: `$${(stats?.total_billed || 0).toLocaleString()}`,
      icon: Receipt,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      action: () => navigate("/my-billing"),
    },
    {
      title: "Organization Status",
      value: stats?.organization?.status || "N/A",
      icon: Building2,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="my-dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {admin?.name}! Here's your organization overview.
        </p>
      </div>

      {/* Organization Info Card */}
      {stats?.organization && (
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{stats.organization.name}</h2>
                  <p className="text-sm text-muted-foreground">{stats.organization.email}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  stats.organization.status === "approved"
                    ? "status-approved"
                    : stats.organization.status === "pending"
                    ? "status-pending"
                    : "status-rejected"
                }
              >
                {stats.organization.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children" data-testid="stats-grid">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className={`hover-lift border-border/50 ${stat.action ? 'cursor-pointer' : ''}`}
            onClick={stat.action}
            data-testid={`stat-card-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Details */}
      {stats?.subscription && (
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Subscription</CardTitle>
              <CardDescription>Your active plan details</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/my-subscription")}>
              Manage
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-semibold">{stats.subscription.plan_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className="status-active">
                  {stats.subscription.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-semibold">${stats.subscription.amount}/mo</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billing Cycle</p>
                <p className="font-semibold capitalize">{stats.subscription.billing_cycle}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/my-users")}>
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button variant="outline" onClick={() => navigate("/my-user-requests")}>
              <UserPlus className="mr-2 h-4 w-4" />
              User Requests
            </Button>
            <Button variant="outline" onClick={() => navigate("/my-billing")}>
              <Receipt className="mr-2 h-4 w-4" />
              View Billing
            </Button>
            <Button variant="outline" onClick={() => navigate("/request-upgrade")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Request Plan Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
