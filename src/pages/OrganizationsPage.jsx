import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { organizationsApi, plansApi } from "../lib/api";
import { toast } from "sonner";
import { Building2, Search, MoreVertical, Trash2, Eye, Mail, Phone, Globe, Edit, Hash, AtSign, Plus, Layers3, Users, Package } from "lucide-react";
import { format } from "date-fns";
import OnboardingFormSections from "../components/OnboardingFormSections";
import { buildInitialData, buildPayloadFromData, organizationSections } from "../lib/onboardingFields";

const parseList = (value) =>
  (value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatList = (value) => (Array.isArray(value) ? value.join(", ") : "");

const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return parseList(value);
    }
    return parseList(value);
  }
  return [];
};

const getOrganizationTools = (org) => {
  const explicitTools = toList(org?.requested_tools)
    .map((tool) => (typeof tool === "string" ? tool : tool?.name || tool?.id || tool?.product_name || tool?.product_key))
    .filter(Boolean);
  if (explicitTools.length > 0) return explicitTools;
  return toList(org?.active_plan_details)
    .map((plan) => plan.product_name || plan.product_key)
    .filter(Boolean);
};

const getOrganizationPlanLabel = (org) => {
  if (org?.plan_display) return org.plan_display;
  if (Array.isArray(org?.active_plan_details) && org.active_plan_details.length > 0) {
    return org.active_plan_details
      .map((plan) => `${plan.product_name || plan.product_key || "Product"} - ${plan.plan_name || plan.plan_id}`)
      .join(", ");
  }
  if (Array.isArray(org?.requested_plan_details) && org.requested_plan_details.length > 0) {
    return org.requested_plan_details
      .map((plan) => `${plan.product_name || "Product"} - ${plan.plan_name || plan.plan_id}`)
      .join(", ");
  }
  if (Array.isArray(org?.requested_plans) && org.requested_plans.length > 0) return org.requested_plans.join(", ");
  if (typeof org?.requested_plan === "string" && org.requested_plan !== "[]") return org.requested_plan;
  return "No active plan";
};

const createOrganizationSections = organizationSections
  .map((section) => ({
    ...section,
    fields: section.fields.filter((field) => !field.readOnly),
  }))
  .filter((section) => section.fields.length > 0);

const emptyCreateData = {
  ...buildInitialData(createOrganizationSections),
  name: "",
  email: "",
  domain: "",
  requested_plans: [],
  requested_tools_by_plan: {},
  contact_person: "",
  phone: "",
  address: "",
  description: "",
  gateway_region: "",
  gateway_organization_name: "",
  gateway_environment_type: "",
  gateway_environments: "",
};

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [orgStructure, setOrgStructure] = useState({ business_units: [], teams: [], team_members: [] });
  const [loadingStructure, setLoadingStructure] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [createData, setCreateData] = useState(emptyCreateData);
  const [planCatalog, setPlanCatalog] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [editData, setEditData] = useState({
    ...buildInitialData(organizationSections),
    external_org_id: "",
    supported_domains: "",
    gateway_region: "",
    gateway_organization_name: "",
    gateway_environment_type: "",
    gateway_environments: "",
  });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter]);

  useEffect(() => {
    if (showCreateDialog) {
      fetchPlanCatalog();
    }
  }, [showCreateDialog]);

  const fetchOrganizations = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await organizationsApi.getAll(params);
      setOrganizations(response.data);
    } catch (error) {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanCatalog = async () => {
    setLoadingPlans(true);
    try {
      const response = await plansApi.getAll({ active_only: true });
      setPlanCatalog(response.data || []);
    } catch (error) {
      toast.error("Failed to load product plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    try {
      await organizationsApi.delete(selectedOrg.id);
      toast.success(`${selectedOrg.name} has been deleted`);
      fetchOrganizations();
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("Failed to delete organization");
    }
  };

  const handleCreate = async () => {
    if (
      !createData.name.trim() ||
      !createData.email.trim() ||
      !createData.domain.trim() ||
      !createData.contact_person.trim() ||
      !createData.phone.trim() ||
      !createData.address.trim() ||
      !createData.description.trim()
    ) {
      toast.error("Organization name, email, domain, contact person, contact phone, company address, and description are required");
      return;
    }

    const requestedPlans = createData.requested_plans.map((planId) => ({
      plan_id: planId,
      tool_ids: createData.requested_tools_by_plan[planId] || [],
    }));

    setCreating(true);
    try {
      const organizationPayload = buildPayloadFromData(createOrganizationSections, createData);
      await organizationsApi.create({
        ...organizationPayload,
        name: createData.name.trim(),
        email: createData.email.trim(),
        domain: createData.domain.trim() || null,
        requested_plans: requestedPlans,
        contact_person: createData.contact_person.trim(),
        phone: createData.phone.trim() || null,
        gateway_region: createData.gateway_region.trim() || null,
        gateway_organization_name: createData.gateway_organization_name.trim() || null,
        gateway_environment_type: createData.gateway_environment_type.trim() || null,
        gateway_environments: parseList(createData.gateway_environments),
      });
      toast.success("Organization added successfully");
      setCreateData(emptyCreateData);
      setShowCreateDialog(false);
      fetchOrganizations();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to add organization";
      toast.error(typeof message === "string" ? message : "Failed to add organization");
    } finally {
      setCreating(false);
    }
  };

  const getPlanTools = (plan) => (plan.plan_tools || []).filter((tool) => tool.is_active !== false);

  const togglePlanSelection = (plan) => {
    const isSelected = createData.requested_plans.includes(plan.id);
    if (isSelected) {
      const nextTools = { ...createData.requested_tools_by_plan };
      delete nextTools[plan.id];
      setCreateData({
        ...createData,
        requested_plans: createData.requested_plans.filter((planId) => planId !== plan.id),
        requested_tools_by_plan: nextTools,
      });
      return;
    }

    setCreateData({
      ...createData,
      requested_plans: [...createData.requested_plans, plan.id],
      requested_tools_by_plan: {
        ...createData.requested_tools_by_plan,
        [plan.id]: getPlanTools(plan).map((tool) => tool.id),
      },
    });
  };

  const togglePlanToolSelection = (plan, tool) => {
    const selectedTools = createData.requested_tools_by_plan[plan.id] || [];
    const nextTools = selectedTools.includes(tool.id)
      ? selectedTools.filter((toolId) => toolId !== tool.id)
      : [...selectedTools, tool.id];

    setCreateData({
      ...createData,
      requested_plans: createData.requested_plans.includes(plan.id)
        ? createData.requested_plans
        : [...createData.requested_plans, plan.id],
      requested_tools_by_plan: {
        ...createData.requested_tools_by_plan,
        [plan.id]: nextTools,
      },
    });
  };

  const plansByProduct = planCatalog.reduce((groups, plan) => {
    const key = plan.product_key || plan.product_id || plan.tool || "other";
    if (!groups[key]) {
      groups[key] = {
        key,
        name: plan.product_name || key,
        plans: [],
      };
    }
    groups[key].plans.push(plan);
    return groups;
  }, {});

  const openEditDialog = (org) => {
    setSelectedOrg(org);
    setEditData({
      ...buildInitialData(organizationSections, org),
      email: org.email || "",
      domain: org.domain || "",
      contact_person: org.contact_person || "",
      phone: org.phone || "",
      address: org.address || "",
      external_org_id: org.external_org_id || "",
      auth0_org_id: org.auth0_org_id || "",
      zitadel_org_id: org.zitadel_org_id || "",
      supported_domains: formatList(toList(org.supported_domains)),
      gateway_region: org.gateway_region || "",
      gateway_organization_name: org.gateway_organization_name || "",
      gateway_environment_type: org.gateway_environment_type || "",
      gateway_environments: formatList(toList(org.gateway_environments)),
    });
    setShowEditDialog(true);
  };

  const openDetailDialog = async (org) => {
    setSelectedOrg(org);
    setOrgStructure({ business_units: [], teams: [], team_members: [] });
    setShowDetailDialog(true);
    setLoadingStructure(true);
    try {
      const response = await organizationsApi.getDetails(org.id);
      setSelectedOrg(response.data.organization || org);
      setOrgStructure({
        business_units: response.data.business_units || [],
        teams: response.data.teams || [],
        team_members: response.data.team_members || [],
      });
    } catch (error) {
      toast.error("Failed to load organization Business units and Projects");
    } finally {
      setLoadingStructure(false);
    }
  };

  const getTeamsForBu = (businessUnitId) =>
    (orgStructure.teams || []).filter((team) => team.business_unit_id === businessUnitId);

  const getUnassignedTeams = () =>
    (orgStructure.teams || []).filter((team) => !team.business_unit_id);

  const getMembersForTeam = (teamId) =>
    (orgStructure.team_members || []).filter((member) => member.project_id === teamId);

  const renderTeamSummary = (team) => {
    const teamMembers = getMembersForTeam(team.id);
    return (
      <div key={team.id} className="rounded-md bg-muted/50 px-3 py-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{team.name}</p>
            <p className="text-xs text-muted-foreground">{team.description || team.code || "No description"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{team.status || "active"}</Badge>
            <Badge variant="secondary">{teamMembers.length} member(s)</Badge>
          </div>
        </div>
        {teamMembers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {teamMembers.map((member) => (
              <Badge key={member.id} variant="outline" className="text-xs">
                {member.name || member.email}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSaveEdit = async () => {
    if (!selectedOrg) return;
    if (
      !editData.name?.trim() ||
      !editData.email?.trim() ||
      !editData.domain?.trim() ||
      !editData.contact_person?.trim() ||
      !editData.phone?.trim() ||
      !editData.address?.trim() ||
      !editData.description?.trim()
    ) {
      toast.error("Organization name, email, domain, contact person, contact phone, company address, and description are required");
      return;
    }
    setSaving(true);
    try {
      const domainsArray = editData.supported_domains
        .split(",")
        .map(d => d.trim())
        .filter(d => d.length > 0)
        .map(d => d.startsWith("@") ? d : `@${d}`);  // Ensure @ prefix

      const organizationPayload = buildPayloadFromData(organizationSections, editData);
      await organizationsApi.update(selectedOrg.id, {
        ...organizationPayload,
        name: editData.name.trim(),
        email: editData.email.trim(),
        domain: editData.domain.trim() || null,
        contact_person: editData.contact_person.trim(),
        phone: editData.phone.trim() || null,
        address: editData.address.trim() || null,
        external_org_id: editData.external_org_id || null,
        auth0_org_id: editData.auth0_org_id || null,
        zitadel_org_id: editData.zitadel_org_id || null,
        supported_domains: domainsArray.length > 0 ? domainsArray : null,
        gateway_region: editData.gateway_region || null,
        gateway_organization_name: editData.gateway_organization_name || null,
        gateway_environment_type: editData.gateway_environment_type || null,
        gateway_environments: parseList(editData.gateway_environments),
      });
      toast.success("Organization updated successfully");
      fetchOrganizations();
      setShowEditDialog(false);
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to update organization";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const classes = {
      pending: "status-pending",
      approved: "status-approved",
      rejected: "status-rejected",
    };
    return (
      <Badge variant="outline" className={classes[status] || ""}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="organizations-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">All Organizations</h1>
          <p className="text-muted-foreground mt-1">Manage all registered organizations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50" data-testid="organizations-table">
        <CardContent className="p-0">
          {filteredOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No organizations found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.map((org) => (
                  <TableRow key={org.id} data-testid={`org-row-${org.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.domain || "No domain"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.external_org_id ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {org.external_org_id}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{org.contact_person}</p>
                        <p className="text-xs text-muted-foreground">{org.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getOrganizationPlanLabel(org)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(org.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailDialog(org)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(org)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Integration
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setSelectedOrg(org); setShowDeleteDialog(true); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl" data-testid="create-org-dialog">
          <DialogHeader>
            <DialogTitle>Add Organization</DialogTitle>
            <DialogDescription>
              Create a new organization request with the full onboarding field mapping.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <CreateInput label="Organization Email" type="email" value={createData.email} onChange={(value) => setCreateData({ ...createData, email: value })} required />
            <CreateInput label="Domain" placeholder="example.com" value={createData.domain} onChange={(value) => setCreateData({ ...createData, domain: value })} required />
            <CreateInput label="Contact Person" value={createData.contact_person} onChange={(value) => setCreateData({ ...createData, contact_person: value })} required />
            <CreateInput label="Contact Phone" value={createData.phone} onChange={(value) => setCreateData({ ...createData, phone: value })} required />
            <div className="space-y-2 md:col-span-2">
              <Label>Company Address <span className="text-destructive">*</span></Label>
              <Textarea
                value={createData.address}
                onChange={(e) => setCreateData({ ...createData, address: e.target.value })}
                rows={2}
                required
              />
            </div>
            <div className="md:col-span-2">
              <OnboardingFormSections
                sections={createOrganizationSections}
                formData={createData}
                onChange={setCreateData}
              />
            </div>
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Product Plans <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                <Badge variant="secondary">{createData.requested_plans.length} selected</Badge>
              </div>
              {loadingPlans ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Loading product plans...
                </div>
              ) : planCatalog.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No active plans found.
                </div>
              ) : (
                <div className="space-y-3 rounded-md border p-3">
                  {Object.values(plansByProduct).map((product) => (
                    <div key={product.key} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{product.name}</span>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {product.plans.map((plan) => {
                          const isPlanSelected = createData.requested_plans.includes(plan.id);
                          const selectedTools = createData.requested_tools_by_plan[plan.id] || [];
                          const planTools = getPlanTools(plan);
                          return (
                            <div key={plan.id} className="rounded-md border bg-background/60 p-3">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isPlanSelected}
                                  onCheckedChange={() => togglePlanSelection(plan)}
                                  aria-label={`Select ${plan.product_name || plan.product_key} ${plan.name}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium leading-none">{plan.name}</p>
                                    <Badge variant="outline" className="text-xs">{plan.price_label || plan.price || "$0"}</Badge>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">{plan.id}</p>
                                </div>
                              </div>
                              {planTools.length > 0 && (
                                <div className="mt-3 space-y-2 border-t pt-3">
                                  {planTools.map((tool) => (
                                    <label key={tool.id} className="flex items-start gap-2 text-sm">
                                      <Checkbox
                                        checked={selectedTools.includes(tool.id)}
                                        onCheckedChange={() => togglePlanToolSelection(plan, tool)}
                                        aria-label={`Select ${tool.name}`}
                                      />
                                      <span className="min-w-0">
                                        <span className="block font-medium leading-none">{tool.name}</span>
                                        <span className="mt-1 block text-xs text-muted-foreground">{tool.id}</span>
                                      </span>
                                    </label>
                                  ))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Adding..." : "Add Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl" data-testid="detail-dialog">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">{selectedOrg.name}</h3>
                  {getStatusBadge(selectedOrg.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrg.email}</span>
                </div>
                {selectedOrg.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrg.phone}</span>
                  </div>
                )}
                {selectedOrg.domain && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrg.domain}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Person</p>
                  <p className="font-medium">{selectedOrg.contact_person}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
                  <Badge variant="secondary">{getOrganizationPlanLabel(selectedOrg)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm">{format(new Date(selectedOrg.created_at), "PPP")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tools</p>
                  <div className="flex flex-wrap gap-1">
                    {getOrganizationTools(selectedOrg).map((tool) => (
                      <Badge key={tool} variant="outline" className="text-xs">
                        {String(tool).replace("_", " ")}
                      </Badge>
                    ))}
                    {getOrganizationTools(selectedOrg).length === 0 && (
                      <span className="text-sm text-muted-foreground">Not configured</span>
                    )}
                  </div>
                </div>
              </div>

              <OrganizationFieldSummary organization={selectedOrg} />

              {selectedOrg.rejection_reason && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm text-destructive">{selectedOrg.rejection_reason}</p>
                </div>
              )}

              {/* Integration Settings */}
              {selectedOrg.status === "approved" && (
                <div className="pt-4 border-t space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Integration Settings</p>
                  <div className="flex items-center gap-3 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">External Org ID:</span>
                    {selectedOrg.external_org_id ? (
                      <Badge variant="outline" className="font-mono">{selectedOrg.external_org_id}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <AtSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">Supported Domains:</span>
                      {toList(selectedOrg.supported_domains).length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {toList(selectedOrg.supported_domains).map((domain) => (
                            <Badge key={domain} variant="secondary" className="font-mono text-xs">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic ml-1">Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Gateway Onboarding</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Region</p>
                    <p className="font-medium">{selectedOrg.gateway_region || "Not configured"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gateway Org Name</p>
                    <p className="font-medium">{selectedOrg.gateway_organization_name || "Not configured"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Environment Type</p>
                    <p className="font-medium">{selectedOrg.gateway_environment_type || "Not configured"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Environments</p>
                    <div className="flex flex-wrap gap-1">
                      {toList(selectedOrg.gateway_environments).length > 0 ? (
                        toList(selectedOrg.gateway_environments).map((environment) => (
                          <Badge key={environment} variant="outline" className="text-xs">
                            {environment}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Business units and Projects</p>
                    <p className="text-sm text-muted-foreground">
                      {orgStructure.business_units.length} Business unit(s), {orgStructure.teams.length} project(s), {orgStructure.team_members.length} member(s)
                    </p>
                  </div>
                </div>

                {loadingStructure ? (
                  <div className="flex items-center justify-center rounded-lg border py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : orgStructure.business_units.length === 0 && orgStructure.teams.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Layers3 className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 font-medium">No business units onboarded</p>
                    <p className="text-sm text-muted-foreground">Business units and Projects will appear here once this organization onboards them.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orgStructure.business_units.map((bu) => {
                      const buTeams = getTeamsForBu(bu.id);
                      return (
                        <div key={bu.id} className="rounded-lg border p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold">{bu.name}</h4>
                                <Badge variant="outline">{bu.status || "active"}</Badge>
                                {bu.code && <Badge variant="secondary">{bu.code}</Badge>}
                              </div>
                              <div className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                                <span>Application: <span className="font-medium text-foreground">{bu.application_name || "-"}</span></span>
                                <span>Owner: <span className="font-medium text-foreground">{bu.owner_name || "-"}</span></span>
                                <span>Members: <span className="font-medium text-foreground">{bu.members_count ?? 0}</span></span>
                                <span>Consumers: <span className="font-medium text-foreground">{bu.consumers_count ?? 0}</span></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {buTeams.length} project(s)
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {buTeams.length === 0 ? (
                              <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">No projects onboarded for this Business unit.</p>
                            ) : (
                              buTeams.map((team) => renderTeamSummary(team))
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {getUnassignedTeams().length > 0 && (
                      <div className="rounded-lg border border-dashed p-4">
                        <div className="flex items-center gap-2">
                          <Layers3 className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold">Projects Without Business unit</h4>
                        </div>
                        <div className="mt-4 space-y-2">
                          {getUnassignedTeams().map((team) => renderTeamSummary(team))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOrg?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="max-h-[45vh] overflow-y-auto rounded-md border p-3">
              <OrganizationFieldSummary organization={selectedOrg} compact />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl" data-testid="edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization profile, onboarding fields, and integration settings for {selectedOrg?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <CreateInput label="Organization Email" type="email" value={editData.email} onChange={(value) => setEditData({ ...editData, email: value })} required />
              <CreateInput label="Domain" placeholder="example.com" value={editData.domain} onChange={(value) => setEditData({ ...editData, domain: value })} required />
              <CreateInput label="Contact Person" value={editData.contact_person} onChange={(value) => setEditData({ ...editData, contact_person: value })} required />
              <CreateInput label="Contact Phone" value={editData.phone} onChange={(value) => setEditData({ ...editData, phone: value })} required />
              <div className="space-y-2 md:col-span-2">
                <Label>Company Address <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Company address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  rows={2}
                  required
                />
              </div>
            </div>

            <OnboardingFormSections sections={organizationSections} formData={editData} onChange={setEditData} />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Integration</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <CreateInput label="External Organization ID" placeholder="e.g., KRE, TECHCORP, ORG123" value={editData.external_org_id} onChange={(value) => setEditData({ ...editData, external_org_id: value })} />
                <CreateInput label="Auth0 Organization ID" value={editData.auth0_org_id} onChange={(value) => setEditData({ ...editData, auth0_org_id: value })} />
                <CreateInput label="Zitadel Organization ID" value={editData.zitadel_org_id} onChange={(value) => setEditData({ ...editData, zitadel_org_id: value })} />
                <div className="space-y-2 md:col-span-2">
                  <Label>Supported Email Domains</Label>
                  <Textarea
                    placeholder="@kre.com, @probestack.io"
                    value={editData.supported_domains}
                    onChange={(e) => setEditData({ ...editData, supported_domains: e.target.value })}
                    rows={2}
                  />
                </div>
                <CreateInput label="Gateway Region" placeholder="LATAM" value={editData.gateway_region} onChange={(value) => setEditData({ ...editData, gateway_region: value })} />
                <CreateInput label="Gateway Organization Name" placeholder="as-2" value={editData.gateway_organization_name} onChange={(value) => setEditData({ ...editData, gateway_organization_name: value })} />
                <CreateInput label="Environment Type" placeholder="prod or non-prod" value={editData.gateway_environment_type} onChange={(value) => setEditData({ ...editData, gateway_environment_type: value })} />
                <CreateInput label="Gateway Environments" placeholder="preprod, prod, staging, custom" value={editData.gateway_environments} onChange={(value) => setEditData({ ...editData, gateway_environments: value })} />
              </div>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateInput({ label, onChange, required, ...props }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input {...props} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function OrganizationFieldSummary({ organization, compact = false }) {
  if (!organization) return null;

  const formatValue = (value) => {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Not set";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value || "Not set";
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-4 pt-4 border-t"}>
      {!compact && <p className="text-xs text-muted-foreground uppercase tracking-wider">Organization Fields</p>}
      {organizationSections.map((section) => {
        const visibleFields = section.fields.filter((field) => {
          const value = organization[field.key];
          return field.readOnly || value !== null && value !== undefined && value !== "";
        });
        if (visibleFields.length === 0) return null;
        return (
          <div key={section.title} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleFields.map((field) => (
                <div key={field.key} className="min-w-0">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="truncate text-sm font-medium">{formatValue(organization[field.key])}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
