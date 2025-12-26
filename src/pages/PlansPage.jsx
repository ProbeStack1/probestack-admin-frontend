import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { getErrorMessage } from "../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { plansApi } from "../lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Check, Package, Zap, ArrowLeftRight } from "lucide-react";

const TOOLS = [
  { id: "api_platform", name: "API Platform", icon: Package, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "ai_agentic", name: "AI Agentic", icon: Zap, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "migration_tool", name: "Migration Tool", icon: ArrowLeftRight, color: "text-amber-500", bgColor: "bg-amber-500/10" },
];

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState("api_platform");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    tool: "api_platform",
    description: "",
    features: "",
    price_monthly: "",
    price_yearly: "",
  });

  const fetchPlans = useCallback(async () => {
    try {
      const response = await plansApi.getAll({ tool: selectedTool });
      setPlans(response.data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [selectedTool]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreate = async () => {
    try {
      const data = {
        ...formData,
        features: formData.features.split("\n").filter((f) => f.trim()),
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
      };
      await plansApi.create(data);
      toast.success("Plan created successfully");
      fetchPlans();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create plan"));
    }
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;
    try {
      const data = {
        ...formData,
        features: formData.features.split("\n").filter((f) => f.trim()),
        price_monthly: parseFloat(formData.price_monthly),
        price_yearly: parseFloat(formData.price_yearly),
      };
      await plansApi.update(selectedPlan.id, data);
      toast.success("Plan updated successfully");
      fetchPlans();
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update plan"));
    }
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    try {
      await plansApi.delete(selectedPlan.id);
      toast.success("Plan deleted successfully");
      fetchPlans();
      setShowDeleteDialog(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const openEditDialog = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      tool: plan.tool,
      description: plan.description,
      features: plan.features.join("\n"),
      price_monthly: plan.price_monthly.toString(),
      price_yearly: plan.price_yearly.toString(),
    });
    setShowEditDialog(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, tool: selectedTool }));
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      tool: "api_platform",
      description: "",
      features: "",
      price_monthly: "",
      price_yearly: "",
    });
    setSelectedPlan(null);
  };

  const currentTool = TOOLS.find((t) => t.id === selectedTool);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="plans-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Product Plans</h1>
          <p className="text-muted-foreground mt-1">Manage subscription plans for each tool</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-plan-btn">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Tool Tabs */}
      <Tabs value={selectedTool} onValueChange={setSelectedTool}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          {TOOLS.map((tool) => (
            <TabsTrigger key={tool.id} value={tool.id} className="flex items-center gap-2">
              <tool.icon className={`h-4 w-4 ${tool.color}`} />
              <span className="hidden sm:inline">{tool.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TOOLS.map((tool) => (
          <TabsContent key={tool.id} value={tool.id} className="mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                <tool.icon className={`h-6 w-6 ${tool.color}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{tool.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {plans.length} plan{plans.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>

            {/* Plans Grid */}
            {plans.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className={`h-16 w-16 rounded-full ${tool.bgColor} flex items-center justify-center mb-4`}>
                    <tool.icon className={`h-8 w-8 ${tool.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg">No plans yet</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-4">
                    Create your first plan for {tool.name}
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className="border-border/50 hover-lift"
                    data-testid={`plan-card-${plan.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(plan)}
                            data-testid={`edit-btn-${plan.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => { setSelectedPlan(plan); setShowDeleteDialog(true); }}
                            data-testid={`delete-btn-${plan.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">${plan.price_monthly}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        or ${plan.price_yearly}/year (save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                      </p>
                      <div className="pt-4 border-t space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setShowEditDialog(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg" data-testid="plan-dialog">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {showEditDialog ? "Update the plan details" : "Add a new subscription plan"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  placeholder="e.g., Starter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="plan-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Tool</Label>
                <Select
                  value={formData.tool}
                  onValueChange={(value) => setFormData({ ...formData, tool: value })}
                >
                  <SelectTrigger data-testid="plan-tool-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOLS.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id}>
                        {tool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the plan"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                data-testid="plan-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price ($)</Label>
                <Input
                  type="number"
                  placeholder="29.00"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  data-testid="plan-price-monthly-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Yearly Price ($)</Label>
                <Input
                  type="number"
                  placeholder="290.00"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                  data-testid="plan-price-yearly-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea
                placeholder="5 APIs&#10;1000 requests/day&#10;Basic analytics"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                rows={4}
                data-testid="plan-features-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditDialog ? handleUpdate : handleCreate}
              data-testid="save-plan-btn"
            >
              {showEditDialog ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the &quot;{selectedPlan?.name}&quot; plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}