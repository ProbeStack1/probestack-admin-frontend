import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { myOrganizationApi, plansApi } from "../lib/api";
import { toast } from "sonner";
import { TrendingUp, ArrowLeft, Package } from "lucide-react";

export default function RequestUpgradePage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSubscriptions, setCurrentSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [selectedToolsByPlan, setSelectedToolsByPlan] = useState({});
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const genericAccessToolPattern = /^(starter|enterprise|enterprise\s*-\s*plus.*)\s+access$/i;
  const getPlanTools = (plan) => plan?.plan_tools || [];
  const getVisiblePlanTools = (plan) =>
    getPlanTools(plan).filter((tool) => !genericAccessToolPattern.test(String(tool.name || tool.id || "").trim()));
  const plansByProduct = plans.reduce((groups, plan) => {
    const key = plan.product_id || plan.product_key || plan.tool || "other";
    if (!groups[key]) {
      groups[key] = {
        key,
        name: plan.product_name || plan.product_key || plan.tool || "Product",
        plans: [],
      };
    }
    groups[key].plans.push(plan);
    return groups;
  }, {});
  const selectedPlanDetails = selectedPlans
    .map((planId) => plans.find((plan) => plan.id === planId))
    .filter(Boolean);
  const activeProductIds = new Set(
    currentSubscriptions
      .map((sub) => sub.product_id || sub.product_key)
      .filter(Boolean)
  );
  const activePlanIds = new Set(
    currentSubscriptions
      .map((sub) => sub.plan_id)
      .filter(Boolean)
  );

  const fetchData = async () => {
    try {
      const [plansRes, subsRes] = await Promise.all([
        plansApi.getAll(),
        myOrganizationApi.getSubscription(),
      ]);
      setPlans(plansRes.data);
      setCurrentSubscriptions(subsRes.data.filter((s) => s.status === "active"));
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanToggle = (plan) => {
    if (activePlanIds.has(plan.id)) {
      toast.info("Your organization is already subscribed to this product plan");
      return;
    }
    const isSelected = selectedPlans.includes(plan.id);
    if (isSelected) {
      const nextTools = { ...selectedToolsByPlan };
      delete nextTools[plan.id];
      setSelectedPlans(selectedPlans.filter((planId) => planId !== plan.id));
      setSelectedToolsByPlan(nextTools);
      return;
    }

    const sameProductPlanIds = plans
      .filter((candidate) => (candidate.product_id || candidate.product_key || candidate.tool) === (plan.product_id || plan.product_key || plan.tool))
      .map((candidate) => candidate.id);
    const nextTools = { ...selectedToolsByPlan };
    sameProductPlanIds.forEach((planId) => delete nextTools[planId]);
    nextTools[plan.id] = getPlanTools(plan).map((tool) => tool.id || tool.name);
    setSelectedPlans([
      ...selectedPlans.filter((planId) => !sameProductPlanIds.includes(planId)),
      plan.id,
    ]);
    setSelectedToolsByPlan(nextTools);
  };

  const handleToolToggle = (plan, tool) => {
    if (activePlanIds.has(plan.id)) {
      toast.info("Your organization is already subscribed to this product plan");
      return;
    }
    const toolValue = tool.id || tool.name;
    const currentTools = selectedToolsByPlan[plan.id] || [];
    const nextTools = currentTools.includes(toolValue)
      ? currentTools.filter((value) => value !== toolValue)
      : [...currentTools, toolValue];
    setSelectedPlans(selectedPlans.includes(plan.id) ? selectedPlans : [...selectedPlans, plan.id]);
    setSelectedToolsByPlan({
      ...selectedToolsByPlan,
      [plan.id]: nextTools,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedPlans.length === 0) { toast.error("Please select at least one plan"); return; }
    const requestedPlans = selectedPlanDetails.map((plan) => ({
      plan_id: plan.id,
      tool_ids: selectedToolsByPlan[plan.id] || [],
    }));
    const missingToolsPlan = selectedPlanDetails.find((plan) => getPlanTools(plan).length > 0 && (selectedToolsByPlan[plan.id] || []).length === 0);
    if (missingToolsPlan) { toast.error(`Please select at least one feature for ${missingToolsPlan.name}`); return; }

    setSubmitting(true);
    try {
      await myOrganizationApi.requestUpgrade({
        requested_plans: requestedPlans,
        reason: reason || null,
      });
      toast.success("Upgrade request submitted");
      navigate("/my-subscription");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit upgrade request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6" data-testid="request-upgrade-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Request Plan Upgrade</h1>
          <p className="text-muted-foreground mt-1">Submit a request to upgrade your subscription plan</p>
        </div>
      </div>

      {currentSubscriptions.length > 0 && (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10"><Package className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Current Active Plans</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {currentSubscriptions.map((subscription) => (
                    <span key={subscription.id} className="rounded-md border px-2 py-1 text-sm font-medium">
                      {subscription.plan_name} (${subscription.amount}/mo)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Upgrade Request</CardTitle>
          <CardDescription>Select as many product plans as your organization needs. A super admin will review your request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Product Plans</Label>
                <span className="rounded-md border px-2 py-1 text-xs font-medium">{selectedPlans.length} selected</span>
              </div>
              {plans.length === 0 ? (
                <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No plans are available.
                </p>
              ) : (
                <div className="space-y-3 rounded-md border p-3">
                  {Object.values(plansByProduct).map((product) => (
                    <div key={product.key} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{product.name}</span>
                        {activeProductIds.has(product.key) && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">active</span>
                        )}
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {product.plans.map((plan) => {
                          const planTools = getVisiblePlanTools(plan);
                          const isAlreadySubscribed = activePlanIds.has(plan.id);
                          const isPlanSelected = selectedPlans.includes(plan.id);
                          const selectedTools = selectedToolsByPlan[plan.id] || [];
                          return (
                            <div key={plan.id} className={`rounded-md border p-3 ${isAlreadySubscribed ? "bg-muted/40 opacity-70" : "bg-background/60"}`}>
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isPlanSelected}
                                  disabled={isAlreadySubscribed}
                                  onCheckedChange={() => handlePlanToggle(plan)}
                                  aria-label={`Select ${product.name} ${plan.name}`}
                                />
                                <button type="button" className="min-w-0 flex-1 text-left disabled:cursor-not-allowed" onClick={() => handlePlanToggle(plan)} disabled={isAlreadySubscribed}>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium">{plan.name}</p>
                                    {isAlreadySubscribed && (
                                      <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">subscribed</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    ${plan.cost ?? plan.price_monthly ?? 0} {plan.billing_period || "monthly"} - {plan.api_limit || 0} APIs
                                  </p>
                                </button>
                              </div>
                              {planTools.length > 0 && (
                                <div className="mt-3 space-y-2 border-t pt-3">
                                  {planTools.map((tool) => {
                                    const toolValue = tool.id || tool.name;
                                    const isSelected = selectedTools.includes(toolValue);
                                    return (
                                      <label key={tool.id || tool.name} className="flex items-start gap-2 text-sm">
                                        <Checkbox
                                          checked={isSelected}
                                          disabled={isAlreadySubscribed}
                                          onCheckedChange={() => handleToolToggle(plan, tool)}
                                          aria-label={`Select ${tool.name}`}
                                        />
                                        <span className="leading-tight">{tool.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reason for Upgrade (Optional)</Label>
              <Textarea placeholder="Tell us why you want to upgrade..." value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Upgrade Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
