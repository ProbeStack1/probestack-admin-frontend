import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { CreditCard, Calendar, DollarSign, Package, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";

export default function MySubscriptionPage() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, upgradeRes] = await Promise.all([
        myOrganizationApi.getSubscription(),
        myOrganizationApi.getUpgradeRequests(),
      ]);
      setSubscriptions(subsRes.data);
      setUpgradeRequests(upgradeRes.data);
    } catch (error) {
      toast.error("Failed to load subscription data");
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

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const historicalSubs = subscriptions.filter((s) => s.status !== "active");

  return (
    <div className="space-y-6" data-testid="my-subscription-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Subscription</h1>
          <p className="text-muted-foreground mt-1">View and manage your subscription plan</p>
        </div>
        <Button onClick={() => navigate("/request-upgrade")}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Request Upgrade
        </Button>
      </div>

      {/* Active Subscriptions */}
      {activeSubs.length > 0 ? (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Active Subscriptions
            </CardTitle>
            <CardDescription>Your current plan details by subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {activeSubs.map((activeSub) => (
                <div key={activeSub.id} className="rounded-md border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-sm">Product / Plan</span>
                      </div>
                      <p className="text-xl font-bold">{activeSub.product_name ? `${activeSub.product_name} - ` : ""}{activeSub.plan_name}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Amount</span>
                      </div>
                      <p className="text-xl font-bold">${activeSub.amount}/mo</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Start Date</span>
                      </div>
                      <p className="text-xl font-bold">
                        {format(new Date(activeSub.start_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">End Date</span>
                      </div>
                      <p className="text-xl font-bold">
                        {format(new Date(activeSub.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Features Included</p>
                    <div className="flex flex-wrap gap-2">
                      {(activeSub.tools || []).map((tool) => (
                        <Badge key={`${activeSub.id}-${tool}`} variant="secondary">
                          {tool.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Active Subscription</p>
            <p className="text-muted-foreground mt-1">Contact support to get started with a plan.</p>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Requests */}
      {upgradeRequests.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upgrade Requests
            </CardTitle>
            <CardDescription>Your plan upgrade request history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upgradeRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {req.current_plan_name} -> {req.requested_plan_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested {format(new Date(req.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      req.status === "approved"
                        ? "status-approved"
                        : req.status === "rejected"
                        ? "status-rejected"
                        : "status-pending"
                    }
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription History */}
      {historicalSubs.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>Previous subscriptions by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historicalSubs.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{sub.plan_name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${sub.amount}/mo - {sub.billing_cycle}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        sub.status === "paused"
                          ? "status-pending"
                          : sub.status === "cancelled"
                          ? "status-rejected"
                          : ""
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
