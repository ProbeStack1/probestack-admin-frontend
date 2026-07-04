import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { plansApi } from "../lib/api";
import { toast } from "sonner";
import { 
  Plus, Edit, Trash2, Check, Package, Zap, ArrowLeftRight, 
  Settings2, GripVertical, RefreshCw
} from "lucide-react";

const TOOLS = [
  { id: "api_platform", name: "API Platform", icon: Package, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "forge_catalog", name: "ForgeCatalog - API & MCP Design", icon: Package, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "ai_agentic", name: "Agentic AI", icon: Zap, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "migration_tool", name: "Migration Tool", icon: ArrowLeftRight, color: "text-amber-500", bgColor: "bg-amber-500/10" },
];

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState("api_platform");
  
  // Plan dialogs
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false);
  const [showEditPlanDialog, setShowEditPlanDialog] = useState(false);
  const [showDeletePlanDialog, setShowDeletePlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Tool dialogs
  const [showAddToolDialog, setShowAddToolDialog] = useState(false);
  const [showEditToolDialog, setShowEditToolDialog] = useState(false);
  const [showDeleteToolDialog, setShowDeleteToolDialog] = useState(false);
  const [selectedPlanTool, setSelectedPlanTool] = useState(null);
  const [managingPlanId, setManagingPlanId] = useState(null);
  
  // Form data
  const [planFormData, setPlanFormData] = useState({
    name: "",
    tool: "api_platform",
    description: "",
    features: "",
    api_limit: "",
    cost: "",
  });
  
  const [toolFormData, setToolFormData] = useState({
    name: "",
    description: "",
    display_order: 0,
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

  // Plan handlers
  const handleCreatePlan = async () => {
    try {
      const data = {
        ...planFormData,
        features: planFormData.features.split("\n").filter((f) => f.trim()),
        api_limit: parseInt(planFormData.api_limit) || 0,
        cost: parseFloat(planFormData.cost) || 0,
      };
      await plansApi.create(data);
      toast.success("Plan created successfully");
      fetchPlans();
      setShowCreatePlanDialog(false);
      resetPlanForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create plan"));
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;
    try {
      const data = {
        ...planFormData,
        features: planFormData.features.split("\n").filter((f) => f.trim()),
        api_limit: parseInt(planFormData.api_limit) || 0,
        cost: parseFloat(planFormData.cost) || 0,
      };
      await plansApi.update(selectedPlan.id, data);
      toast.success("Plan updated successfully");
      fetchPlans();
      setShowEditPlanDialog(false);
      resetPlanForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update plan"));
    }
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      await plansApi.delete(selectedPlan.id);
      toast.success("Plan deleted successfully");
      fetchPlans();
      setShowDeletePlanDialog(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  // Tool handlers
  const handleAddTool = async () => {
    if (!managingPlanId) return;
    try {
      const data = {
        ...toolFormData,
        display_order: parseInt(toolFormData.display_order) || 0,
      };
      await plansApi.createTool(managingPlanId, data);
      toast.success("Tool added successfully");
      fetchPlans();
      setShowAddToolDialog(false);
      resetToolForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add tool"));
    }
  };

  const handleUpdateTool = async () => {
    if (!managingPlanId || !selectedPlanTool) return;
    try {
      const data = {
        ...toolFormData,
        display_order: parseInt(toolFormData.display_order) || 0,
      };
      await plansApi.updateTool(managingPlanId, selectedPlanTool.id, data);
      toast.success("Tool updated successfully");
      fetchPlans();
      setShowEditToolDialog(false);
      resetToolForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update tool"));
    }
  };

  const handleDeleteTool = async () => {
    if (!managingPlanId || !selectedPlanTool) return;
    try {
      await plansApi.deleteTool(managingPlanId, selectedPlanTool.id);
      toast.success("Tool deleted successfully");
      fetchPlans();
      setShowDeleteToolDialog(false);
      setSelectedPlanTool(null);
    } catch (error) {
      toast.error("Failed to delete tool");
    }
  };

  const handleToggleToolStatus = async (planId, tool) => {
    try {
      await plansApi.updateTool(planId, tool.id, { is_active: !tool.is_active });
      toast.success(`Tool ${tool.is_active ? "disabled" : "enabled"}`);
      fetchPlans();
    } catch (error) {
      toast.error("Failed to update tool status");
    }
  };

  // Form helpers
  const openEditPlanDialog = (plan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      name: plan.name,
      tool: plan.tool,
      description: plan.description,
      features: plan.features?.join("\n") || "",
      api_limit: (plan.api_limit || 0).toString(),
      cost: (plan.cost ?? plan.price_monthly ?? 0).toString(),
    });
    setShowEditPlanDialog(true);
  };

  const openCreatePlanDialog = () => {
    resetPlanForm();
    setPlanFormData((prev) => ({ ...prev, tool: selectedTool }));
    setShowCreatePlanDialog(true);
  };

  const openAddToolDialog = (planId) => {
    setManagingPlanId(planId);
    resetToolForm();
    setShowAddToolDialog(true);
  };

  const openEditToolDialog = (planId, tool) => {
    setManagingPlanId(planId);
    setSelectedPlanTool(tool);
    setToolFormData({
      name: tool.name,
      description: tool.description || "",
      display_order: tool.display_order || 0,
    });
    setShowEditToolDialog(true);
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: "",
      tool: "api_platform",
      description: "",
      features: "",
      api_limit: "",
      cost: "",
    });
    setSelectedPlan(null);
  };

  const resetToolForm = () => {
    setToolFormData({
      name: "",
      description: "",
      display_order: 0,
    });
    setSelectedPlanTool(null);
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
          <p className="text-muted-foreground mt-1">Manage plan limits, manual cost, and selectable tools</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPlans}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreatePlanDialog} data-testid="create-plan-btn">
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
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

            {/* Plans */}
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
                  <Button onClick={openCreatePlanDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {plans.map((plan) => {
                  const planCost = plan.cost ?? plan.price_monthly ?? 0;
                  return (
                    <Card key={plan.id} className="border-border/50" data-testid={`plan-card-${plan.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              {plan.name}
                              <Badge variant="outline" className={tool.bgColor}>
                                {tool.name}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">{plan.description}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditPlanDialog(plan)}
                              data-testid={`edit-plan-${plan.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => { setSelectedPlan(plan); setShowDeletePlanDialog(true); }}
                              data-testid={`delete-plan-${plan.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Plan Summary */}
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">APIs Supported</p>
                              <p className="font-semibold">{plan.api_limit || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Manual Cost</p>
                              <p className="font-bold text-lg text-primary">${planCost}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Active Tools</p>
                              <p className="font-semibold">{(plan.plan_tools || []).filter((toolItem) => toolItem.is_active).length}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {/* Tools Section */}
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="tools" className="border-none">
                            <AccordionTrigger className="hover:no-underline py-2">
                              <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                <span>Manage Tools ({plan.plan_tools?.length || 0})</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                <div className="flex justify-end">
                                  <Button size="sm" onClick={() => openAddToolDialog(plan.id)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Tool
                                  </Button>
                                </div>
                                
                                {plan.plan_tools && plan.plan_tools.length > 0 ? (
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[50px]">Order</TableHead>
                                          <TableHead>Tool Name</TableHead>
                                          <TableHead>Description</TableHead>
                                          <TableHead className="text-center">Active</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {plan.plan_tools.map((planTool) => (
                                          <TableRow key={planTool.id} className={!planTool.is_active ? "opacity-50" : ""}>
                                            <TableCell>
                                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                                              {planTool.display_order}
                                            </TableCell>
                                            <TableCell className="font-medium">{planTool.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                              {planTool.description || "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Switch
                                                checked={planTool.is_active}
                                                onCheckedChange={() => handleToggleToolStatus(plan.id, planTool)}
                                              />
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex justify-end gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7"
                                                  onClick={() => openEditToolDialog(plan.id, planTool)}
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 text-destructive"
                                                  onClick={() => {
                                                    setManagingPlanId(plan.id);
                                                    setSelectedPlanTool(planTool);
                                                    setShowDeleteToolDialog(true);
                                                  }}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                                    <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No tools configured yet</p>
                                    <p className="text-sm">Add tools to let users select features</p>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {/* Legacy Features (if any) */}
                        {plan.features && plan.features.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium mb-2">Included Features:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Plan Dialog */}
      <Dialog
        open={showCreatePlanDialog || showEditPlanDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreatePlanDialog(false);
            setShowEditPlanDialog(false);
            resetPlanForm();
          }
        }}
      >
        <DialogContent className="max-w-lg" data-testid="plan-dialog">
          <DialogHeader>
            <DialogTitle>{showEditPlanDialog ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {showEditPlanDialog ? "Update the plan details" : "Add a new subscription plan"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input
                  placeholder="e.g., Enterprise"
                  value={planFormData.name}
                  onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                  data-testid="plan-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Tool</Label>
                <Select
                  value={planFormData.tool}
                  onValueChange={(value) => setPlanFormData({ ...planFormData, tool: value })}
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
                value={planFormData.description}
                onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                rows={2}
                data-testid="plan-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>APIs Supported</Label>
                <Input
                  type="number"
                  placeholder="0 for unlimited"
                  value={planFormData.api_limit}
                  onChange={(e) => setPlanFormData({ ...planFormData, api_limit: e.target.value })}
                  data-testid="plan-api-limit-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Manual Cost ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={planFormData.cost}
                  onChange={(e) => setPlanFormData({ ...planFormData, cost: e.target.value })}
                  data-testid="plan-cost-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Included Features (one per line)</Label>
              <Textarea
                placeholder="24/7 Support&#10;Priority access&#10;Custom integrations"
                value={planFormData.features}
                onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                rows={3}
                data-testid="plan-features-input"
              />
              <p className="text-xs text-muted-foreground">These are base features included with the plan</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePlanDialog(false);
                setShowEditPlanDialog(false);
                resetPlanForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditPlanDialog ? handleUpdatePlan : handleCreatePlan}
              data-testid="save-plan-btn"
            >
              {showEditPlanDialog ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Dialog */}
      <Dialog open={showDeletePlanDialog} onOpenChange={setShowDeletePlanDialog}>
        <DialogContent data-testid="delete-plan-dialog">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the &quot;{selectedPlan?.name}&quot; plan? 
              This will also delete all associated tools. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletePlanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan} data-testid="confirm-delete-plan-btn">
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tool Dialog */}
      <Dialog open={showAddToolDialog} onOpenChange={setShowAddToolDialog}>
        <DialogContent data-testid="add-tool-dialog">
          <DialogHeader>
            <DialogTitle>Add Tool</DialogTitle>
            <DialogDescription>
              Add a selectable tool for this plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tool Name</Label>
              <Input
                placeholder="e.g., API Design Studio"
                value={toolFormData.name}
                onChange={(e) => setToolFormData({ ...toolFormData, name: e.target.value })}
                data-testid="tool-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description of what this tool does"
                value={toolFormData.description}
                onChange={(e) => setToolFormData({ ...toolFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                placeholder="0"
                value={toolFormData.display_order}
                onChange={(e) => setToolFormData({ ...toolFormData, display_order: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddToolDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTool} data-testid="save-tool-btn">
              Add Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tool Dialog */}
      <Dialog open={showEditToolDialog} onOpenChange={setShowEditToolDialog}>
        <DialogContent data-testid="edit-tool-dialog">
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>
              Update the tool details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tool Name</Label>
              <Input
                placeholder="e.g., API Design Studio"
                value={toolFormData.name}
                onChange={(e) => setToolFormData({ ...toolFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description of what this tool does"
                value={toolFormData.description}
                onChange={(e) => setToolFormData({ ...toolFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                placeholder="0"
                value={toolFormData.display_order}
                onChange={(e) => setToolFormData({ ...toolFormData, display_order: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditToolDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTool}>
              Update Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tool Dialog */}
      <Dialog open={showDeleteToolDialog} onOpenChange={setShowDeleteToolDialog}>
        <DialogContent data-testid="delete-tool-dialog">
          <DialogHeader>
            <DialogTitle>Delete Tool</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedPlanTool?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteToolDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTool} data-testid="confirm-delete-tool-btn">
              Delete Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
