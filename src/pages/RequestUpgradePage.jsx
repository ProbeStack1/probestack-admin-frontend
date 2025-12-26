import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { myOrganizationApi, plansApi } from "../lib/api";
import { toast } from "sonner";
import { TrendingUp, ArrowLeft, Package, Check } from "lucide-react";

export default function RequestUpgradePage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedTools, setSelectedTools] = useState([]);
  const [reason, setReason] = useState("");

  const availableTools = [
    { id: "api_platform", label: "API Platform" },
    { id: "ai_agentic", label: "AI Agentic" },
    { id: "migration_tool", label: "Migration Tool" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, subsRes] = await Promise.all([
        plansApi.getAll(),
        myOrganizationApi.getSubscription(),
      ]);
      setPlans(plansRes.data);
      const activeSub = subsRes.data.find((s) => s.status === "active");
      setCurrentSubscription(activeSub);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleToolToggle = (toolId) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) { toast.error("Please select a plan"); return; }
    if (selectedTools.length === 0) { toast.error("Please select at least one tool"); return; }

    setSubmitting(true);
    try {
      await myOrganizationApi.requestUpgrade({
        requested_plan_id: selectedPlan,
        requested_tools: selectedTools,
        reason: reason || null,
      });
      toast.success("Upgrade request submitted successfully");
      navigate("/my-subscription");
    } catch (error) {
      toast.error("Failed to submit upgrade request");
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

      {currentSubscription && (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10"><Package className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-bold">{currentSubscription.plan_name}</p>
                <p className="text-sm text-muted-foreground">${currentSubscription.amount}/mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Upgrade Request</CardTitle>
          <CardDescription>Select your desired plan and tools. A super admin will review your request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Select New Plan</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name} - ${plan.price_monthly}/mo ({plan.tool})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Select Tools</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {availableTools.map((tool) => {
                  const isSelected = selectedTools.includes(tool.id);
                  return (
                    <button key={tool.id} type="button" onClick={() => handleToolToggle(tool.id)}
                      className={`flex items-center justify-between p-4 rounded-lg border text-left transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                      <span className="font-medium">{tool.label}</span>
                      {isSelected && <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason for Upgrade (Optional)</Label>
              <Textarea placeholder="Tell us why you want to upgrade..." value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Request"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
