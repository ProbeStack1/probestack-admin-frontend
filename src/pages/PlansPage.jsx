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
  Settings2, GripVertical, RefreshCw, Boxes, RotateCcw
} from "lucide-react";

const PRODUCT_VISUALS = {
  forgeshift: { icon: ArrowLeftRight, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  forgecatalog: { icon: Package, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  forgefuzz: { icon: Boxes, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  forgesphere: { icon: Package, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  forgeai: { icon: Zap, color: "text-violet-500", bgColor: "bg-violet-500/10" },
  agentic_ai: { icon: Zap, color: "text-fuchsia-500", bgColor: "bg-fuchsia-500/10" },
};

const getProductVisual = (product) => PRODUCT_VISUALS[product?.key] || {
  icon: Package,
  color: "text-emerald-500",
  bgColor: "bg-emerald-500/10",
};

export default function PlansPage() {
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [inactivePlans, setInactivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  
  // Product dialogs
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false);
  const [showEditProductDialog, setShowEditProductDialog] = useState(false);
  const [showDeleteProductDialog, setShowDeleteProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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
    product_id: "",
    description: "",
    features: "",
    api_limit: "",
    cost: "",
    price_label: "",
    billing_period: "",
    is_popular: false,
  });

  const [productFormData, setProductFormData] = useState({
    name: "",
    key: "",
    description: "",
    display_order: "",
    is_active: true,
  });
  
  const [toolFormData, setToolFormData] = useState({
    name: "",
    description: "",
    display_order: 0,
  });

  const fetchProducts = useCallback(async () => {
    try {
      const response = await plansApi.getProducts({ include_inactive: true });
      const productList = response.data || [];
      setProducts(productList);
      if (!selectedProductId && productList.length > 0) {
        setSelectedProductId(productList[0].id);
      }
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [selectedProductId]);

  const fetchPlans = useCallback(async () => {
    if (!selectedProductId) {
      setPlans([]);
      return;
    }
    try {
      const response = await plansApi.getAll({ product_id: selectedProductId });
      setPlans(response.data);
    } catch (error) {
      toast.error("Failed to load plans");
    }
  }, [selectedProductId]);

  const fetchInactivePlans = useCallback(async () => {
    if (!selectedProductId) {
      setInactivePlans([]);
      return;
    }
    try {
      const response = await plansApi.getInactive({ product_id: selectedProductId });
      setInactivePlans(response.data || []);
    } catch (error) {
      setInactivePlans([]);
      toast.error("Failed to load deactivated plans");
    }
  }, [selectedProductId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchInactivePlans();
  }, [fetchInactivePlans]);

  const refreshProductsAndPlans = async () => {
    await fetchProducts();
    await fetchPlans();
    await fetchInactivePlans();
  };

  const handleCreateProduct = async () => {
    try {
      const data = {
        ...productFormData,
        key: productFormData.key.trim() || undefined,
        display_order: parseInt(productFormData.display_order) || 0,
      };
      const response = await plansApi.createProduct(data);
      toast.success("Product created successfully");
      setShowCreateProductDialog(false);
      resetProductForm();
      await fetchProducts();
      setSelectedProductId(response.data.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create product"));
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    try {
      const data = {
        ...productFormData,
        key: productFormData.key.trim() || undefined,
        display_order: parseInt(productFormData.display_order) || 0,
      };
      await plansApi.updateProduct(selectedProduct.id, data);
      toast.success("Product updated successfully");
      setShowEditProductDialog(false);
      resetProductForm();
      refreshProductsAndPlans();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update product"));
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await plansApi.deleteProduct(selectedProduct.id);
      toast.success("Product updated successfully");
      setShowDeleteProductDialog(false);
      resetProductForm();
      refreshProductsAndPlans();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update product"));
    }
  };

  // Plan handlers
  const handleCreatePlan = async () => {
    try {
      const data = {
        ...planFormData,
        product_id: selectedProductId,
        features: planFormData.features.split("\n").filter((f) => f.trim()),
        api_limit: parseInt(planFormData.api_limit) || 0,
        cost: parseFloat(planFormData.cost) || 0,
        price_label: planFormData.price_label,
        billing_period: planFormData.billing_period || null,
        is_popular: planFormData.is_popular,
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
        price_label: planFormData.price_label,
        billing_period: planFormData.billing_period || null,
        is_popular: planFormData.is_popular,
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
      const response = await plansApi.delete(selectedPlan.id);
      toast.success(response.data?.message || "Plan updated successfully");
      refreshProductsAndPlans();
      setShowDeletePlanDialog(false);
      setSelectedPlan(null);
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  const handleActivatePlan = async (plan) => {
    try {
      await plansApi.activate(plan.id);
      toast.success("Plan activated successfully");
      refreshProductsAndPlans();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to activate plan"));
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
      toast.success("Feature added successfully");
      fetchPlans();
      setShowAddToolDialog(false);
      resetToolForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add feature"));
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
      toast.success("Feature updated successfully");
      fetchPlans();
      setShowEditToolDialog(false);
      resetToolForm();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update feature"));
    }
  };

  const handleDeleteTool = async () => {
    if (!managingPlanId || !selectedPlanTool) return;
    try {
      await plansApi.deleteTool(managingPlanId, selectedPlanTool.id);
      toast.success("Feature deleted successfully");
      fetchPlans();
      setShowDeleteToolDialog(false);
      setSelectedPlanTool(null);
    } catch (error) {
      toast.error("Failed to delete feature");
    }
  };

  const handleToggleToolStatus = async (planId, tool) => {
    try {
      await plansApi.updateTool(planId, tool.id, { is_active: !tool.is_active });
      toast.success(`Feature ${tool.is_active ? "disabled" : "enabled"}`);
      fetchPlans();
    } catch (error) {
      toast.error("Failed to update feature status");
    }
  };

  // Form helpers
  const openEditPlanDialog = (plan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      name: plan.name,
      product_id: plan.product_id || selectedProductId,
      description: plan.description,
      features: plan.features?.join("\n") || "",
      api_limit: (plan.api_limit || 0).toString(),
      cost: (plan.cost ?? plan.price_monthly ?? 0).toString(),
      price_label: plan.price_label || plan.price || "",
      billing_period: plan.billing_period || plan.period || "",
      is_popular: !!plan.is_popular || !!plan.popular,
    });
    setShowEditPlanDialog(true);
  };

  const openCreatePlanDialog = () => {
    resetPlanForm();
    setPlanFormData((prev) => ({ ...prev, product_id: selectedProductId }));
    setShowCreatePlanDialog(true);
  };

  const openEditProductDialog = (product) => {
    setSelectedProduct(product);
    setProductFormData({
      name: product.name || "",
      key: product.key || "",
      description: product.description || "",
      display_order: (product.display_order || 0).toString(),
      is_active: product.is_active !== false,
    });
    setShowEditProductDialog(true);
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
      product_id: selectedProductId,
      description: "",
      features: "",
      api_limit: "",
      cost: "",
      price_label: "",
      billing_period: "",
      is_popular: false,
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

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      key: "",
      description: "",
      display_order: "",
      is_active: true,
    });
    setSelectedProduct(null);
  };

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
          <p className="text-muted-foreground mt-1">Manage products, subscription plans, features, and costs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshProductsAndPlans}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowCreateProductDialog(true)} data-testid="create-product-btn">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
          <Button onClick={openCreatePlanDialog} data-testid="create-plan-btn">
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Product Tabs */}
      {products.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">No products yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Create a product before adding subscription plans.</p>
            <Button onClick={() => setShowCreateProductDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Tabs value={selectedProductId} onValueChange={setSelectedProductId}>
        <TabsList className="flex h-auto w-full max-w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          {products.map((product) => {
            const visual = getProductVisual(product);
            const ProductIcon = visual.icon;
            return (
            <TabsTrigger key={product.id} value={product.id} className="flex items-center gap-2 rounded-md border px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ProductIcon className={`h-4 w-4 ${visual.color}`} />
              <span>{product.name}</span>
              <Badge variant="secondary" className="ml-1">{product.plan_count || 0}</Badge>
            </TabsTrigger>
            );
          })}
        </TabsList>

        {products.map((product) => {
          const visual = getProductVisual(product);
          const ProductIcon = visual.icon;
          return (
          <TabsContent key={product.id} value={product.id} className="mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${visual.bgColor}`}>
                <ProductIcon className={`h-6 w-6 ${visual.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{product.name}</h2>
                  {!product.is_active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plans.length} plan{plans.length !== 1 ? "s" : ""} available
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditProductDialog(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedProduct(product); setShowDeleteProductDialog(true); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Plans */}
            {plans.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className={`h-16 w-16 rounded-full ${visual.bgColor} flex items-center justify-center mb-4`}>
                    <ProductIcon className={`h-8 w-8 ${visual.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg">No plans yet</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-4">
                    Create your first plan for {product.name}
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
                  const displayPrice = plan.price_label || plan.price || `$${planCost}`;
                  return (
                    <Card key={plan.id} className="border-border/50" data-testid={`plan-card-${plan.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              {plan.name}
                              <Badge variant="outline" className={visual.bgColor}>
                                {plan.product_name || product.name}
                              </Badge>
                              {(plan.is_popular || plan.popular) && (
                                <Badge>Most Popular</Badge>
                              )}
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
                              <p className="text-muted-foreground">Display Price</p>
                              <p className="font-bold text-lg text-primary">
                                {displayPrice}
                                {(plan.billing_period || plan.period) && (
                                  <span className="ml-1 text-sm font-medium text-muted-foreground">{plan.billing_period || plan.period}</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">Numeric cost: ${planCost}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Selectable Features</p>
                              <p className="font-semibold">{(plan.plan_tools || []).filter((toolItem) => toolItem.is_active).length}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {/* Selectable Features Section */}
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="tools" className="border-none">
                            <AccordionTrigger className="hover:no-underline py-2">
                              <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                <span>Manage Selectable Features ({plan.plan_tools?.length || 0})</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                <div className="flex justify-end">
                                  <Button size="sm" onClick={() => openAddToolDialog(plan.id)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Feature
                                  </Button>
                                </div>
                                
                                {plan.plan_tools && plan.plan_tools.length > 0 ? (
                                  <div className="rounded-md border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-[50px]">Order</TableHead>
                                          <TableHead>Feature Name</TableHead>
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
                                    <p>No selectable features configured yet</p>
                                    <p className="text-sm">Add features that customers can select with this plan</p>
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

            {inactivePlans.length > 0 && (
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Deactivated Plans</h3>
                    <p className="text-sm text-muted-foreground">Restore a plan when it should be available again.</p>
                  </div>
                  <Badge variant="secondary">{inactivePlans.length}</Badge>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan</TableHead>
                        <TableHead>Display Price</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactivePlans.map((plan) => {
                        const planCost = plan.cost ?? plan.price_monthly ?? 0;
                        const displayPrice = plan.price_label || plan.price || `$${planCost}`;
                        return (
                          <TableRow key={plan.id} className="opacity-75" data-testid={`inactive-plan-${plan.id}`}>
                            <TableCell>
                              <div className="font-medium">{plan.name}</div>
                              <div className="text-sm text-muted-foreground">{plan.description}</div>
                            </TableCell>
                            <TableCell>
                              {displayPrice}
                              {(plan.billing_period || plan.period) && (
                                <span className="ml-1 text-muted-foreground">{plan.billing_period || plan.period}</span>
                              )}
                            </TableCell>
                            <TableCell>{(plan.plan_tools || []).length}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActivatePlan(plan)}
                                data-testid={`activate-plan-${plan.id}`}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
          );
        })}
      </Tabs>
      )}

      {/* Create/Edit Product Dialog */}
      <Dialog
        open={showCreateProductDialog || showEditProductDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateProductDialog(false);
            setShowEditProductDialog(false);
            resetProductForm();
          }
        }}
      >
        <DialogContent className="max-w-lg" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle>{showEditProductDialog ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>
              Products group subscription plans such as Starter, Enterprise, and Enterprise Plus.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  placeholder="e.g., API Platform"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                  data-testid="product-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Product Key</Label>
                <Input
                  placeholder="api_platform"
                  value={productFormData.key}
                  onChange={(e) => setProductFormData({ ...productFormData, key: e.target.value })}
                  data-testid="product-key-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the product"
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={productFormData.display_order}
                  onChange={(e) => setProductFormData({ ...productFormData, display_order: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Visible for new plans</p>
                </div>
                <Switch
                  checked={productFormData.is_active}
                  onCheckedChange={(checked) => setProductFormData({ ...productFormData, is_active: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateProductDialog(false);
                setShowEditProductDialog(false);
                resetProductForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={showEditProductDialog ? handleUpdateProduct : handleCreateProduct}
              data-testid="save-product-btn"
            >
              {showEditProductDialog ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={showDeleteProductDialog} onOpenChange={setShowDeleteProductDialog}>
        <DialogContent data-testid="delete-product-dialog">
          <DialogHeader>
            <DialogTitle>Deactivate Product</DialogTitle>
            <DialogDescription>
              Products with plans are deactivated instead of deleted so subscription history stays intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteProductDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} data-testid="confirm-delete-product-btn">
              Deactivate Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Label>Product</Label>
                <Select
                  value={planFormData.product_id || selectedProductId}
                  onValueChange={(value) => setPlanFormData({ ...planFormData, product_id: value })}
                >
                  <SelectTrigger data-testid="plan-product-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Price</Label>
                <Input
                  placeholder="$40 or Contact Sales"
                  value={planFormData.price_label}
                  onChange={(e) => setPlanFormData({ ...planFormData, price_label: e.target.value })}
                  data-testid="plan-price-label-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Billing Period</Label>
                <Input
                  placeholder="/month/user"
                  value={planFormData.billing_period}
                  onChange={(e) => setPlanFormData({ ...planFormData, billing_period: e.target.value })}
                  data-testid="plan-billing-period-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <Label>Most Popular</Label>
                <p className="text-xs text-muted-foreground">Show the popular badge on pricing cards</p>
              </div>
              <Switch
                checked={planFormData.is_popular}
                onCheckedChange={(checked) => setPlanFormData({ ...planFormData, is_popular: checked })}
              />
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
            <DialogTitle>Remove Plan</DialogTitle>
            <DialogDescription>
              Plans with subscription history are deactivated and can be restored later. Plans with no history are deleted with their selectable features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeletePlanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan} data-testid="confirm-delete-plan-btn">
              Remove Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Feature Dialog */}
      <Dialog open={showAddToolDialog} onOpenChange={setShowAddToolDialog}>
        <DialogContent data-testid="add-tool-dialog">
          <DialogHeader>
            <DialogTitle>Add Feature</DialogTitle>
            <DialogDescription>
              Add a selectable feature for this plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feature Name</Label>
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
                placeholder="Brief description of what this feature includes"
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
              Add Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={showEditToolDialog} onOpenChange={setShowEditToolDialog}>
        <DialogContent data-testid="edit-tool-dialog">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Update the feature details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feature Name</Label>
              <Input
                placeholder="e.g., API Design Studio"
                value={toolFormData.name}
                onChange={(e) => setToolFormData({ ...toolFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description of what this feature includes"
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

      {/* Delete Feature Dialog */}
      <Dialog open={showDeleteToolDialog} onOpenChange={setShowDeleteToolDialog}>
        <DialogContent data-testid="delete-tool-dialog">
          <DialogHeader>
            <DialogTitle>Delete Feature</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedPlanTool?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteToolDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTool} data-testid="confirm-delete-tool-btn">
              Delete Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
