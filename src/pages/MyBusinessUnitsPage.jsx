import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CircleUserRound,
  Edit,
  Layers3,
  Plus,
  Search,
  Tags,
  UsersRound,
} from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "../lib/utils";
import OrganizationTabs from "../components/OrganizationTabs";

const emptyBusinessUnit = {
  name: "",
  code: "",
  description: "",
  application_name: "",
  application_id: "",
  owner_name: "",
  go_live_date: "",
  members_count: "0",
  consumers_count: "0",
  project_sme: "",
  tester: "",
  servicenow_group: "",
  last_synced_at: "",
  sync_status: "synced",
  tags: "",
  status: "active",
};

const noOwnerValue = "__no_owner__";

const getStoredOwnerEmail = (value) => {
  if (!value) return "";
  const match = String(value).match(/<([^>]+)>/);
  return match ? match[1] : value;
};

const getUserSelectValue = (value, users) => {
  const lookup = getStoredOwnerEmail(value);
  if (!lookup) return "";
  const user = users.find((item) => item.email === lookup || item.id === lookup || item.name === lookup);
  return user?.email || lookup;
};

const formatUserOption = (user) => `${user.name} (${user.email})`;

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
};

const toDateTimePayload = (value) => (value ? `${value}T00:00:00` : null);

const formatDate = (value, pattern = "dd/MM/yyyy") => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : format(date, pattern);
};

const parseTags = (value) =>
  value
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const getTags = (businessUnit) => {
  if (Array.isArray(businessUnit.tags)) return businessUnit.tags;
  if (!businessUnit.tags) return [];
  try {
    const parsed = JSON.parse(businessUnit.tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const statusClasses = {
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  inactive: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  archived: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const syncClasses = {
  synced: "text-emerald-600 dark:text-emerald-300",
  pending: "text-amber-600 dark:text-amber-300",
  failed: "text-red-600 dark:text-red-300",
};

export default function MyBusinessUnitsPage() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBusinessUnit, setEditingBusinessUnit] = useState(null);
  const [formData, setFormData] = useState(emptyBusinessUnit);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const [businessUnitsResponse, usersResponse] = await Promise.all([
        myOrganizationApi.getBusinessUnits({ include_projects: true }),
        myOrganizationApi.getUsers(),
      ]);
      setBusinessUnits(businessUnitsResponse.data);
      setOrganizationUsers(usersResponse.data || []);
    } catch (error) {
      toast.error("Failed to load business units");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingBusinessUnit(null);
    setFormData(emptyBusinessUnit);
    setDialogOpen(true);
  };

  const openEditDialog = (businessUnit) => {
    setEditingBusinessUnit(businessUnit);
    setFormData({
      name: businessUnit.name || "",
      code: businessUnit.code || "",
      description: businessUnit.description || "",
      application_name: businessUnit.application_name || "",
      application_id: businessUnit.application_id || "",
      owner_name: getUserSelectValue(businessUnit.owner_name, organizationUsers),
      go_live_date: toDateInputValue(businessUnit.go_live_date),
      members_count: String(businessUnit.members_count ?? 0),
      consumers_count: String(businessUnit.consumers_count ?? 0),
      project_sme: businessUnit.project_sme || "",
      tester: businessUnit.tester || "",
      servicenow_group: businessUnit.servicenow_group || "",
      last_synced_at: toDateInputValue(businessUnit.last_synced_at),
      sync_status: businessUnit.sync_status || "synced",
      tags: getTags(businessUnit).join(", "),
      status: businessUnit.status || "active",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      description: formData.description.trim() || null,
      application_name: formData.application_name.trim() || null,
      application_id: formData.application_id.trim() || null,
      owner_name: formData.owner_name || null,
      go_live_date: toDateTimePayload(formData.go_live_date),
      members_count: Number(formData.members_count || 0),
      consumers_count: Number(formData.consumers_count || 0),
      project_sme: formData.project_sme.trim() || null,
      tester: formData.tester.trim() || null,
      servicenow_group: formData.servicenow_group.trim() || null,
      last_synced_at: toDateTimePayload(formData.last_synced_at),
      sync_status: formData.sync_status,
      tags: parseTags(formData.tags),
      status: formData.status,
    };

    try {
      if (editingBusinessUnit) {
        await myOrganizationApi.updateBusinessUnit(editingBusinessUnit.id, payload);
        toast.success("Business unit updated successfully");
      } else {
        await myOrganizationApi.createBusinessUnit(payload);
        toast.success("Business unit onboarded successfully");
      }

      setDialogOpen(false);
      setFormData(emptyBusinessUnit);
      setEditingBusinessUnit(null);
      fetchBusinessUnits();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save business unit"));
    } finally {
      setProcessing(false);
    }
  };

  const filteredBusinessUnits = businessUnits.filter((businessUnit) => {
    const term = search.toLowerCase();
    const searchable = [
      businessUnit.name,
      businessUnit.code,
      businessUnit.description,
      businessUnit.application_name,
      businessUnit.application_id,
      businessUnit.owner_name,
      businessUnit.project_sme,
      businessUnit.tester,
      businessUnit.servicenow_group,
      ...getTags(businessUnit),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(term);
  });

  return (
    <div className="space-y-6" data-testid="my-business-units-page">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Onboard Business unit</h1>
            <p className="text-muted-foreground mt-1">Create and manage business unit details for your organization</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Onboard Business unit
          </Button>
        </div>
        <OrganizationTabs />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business units ({filteredBusinessUnits.length})
              </CardTitle>
              <CardDescription>Business units available for project onboarding</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search business units..."
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredBusinessUnits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No business units match your search" : "No business units onboarded yet"}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredBusinessUnits.map((businessUnit) => {
                const tags = getTags(businessUnit);
                const syncStatus = businessUnit.sync_status || "synced";
                return (
                  <div
                    key={businessUnit.id}
                    className="rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-xl font-semibold">{businessUnit.name}</h2>
                          <Badge variant="outline" className={statusClasses[businessUnit.status] || statusClasses.inactive}>
                            {(businessUnit.status || "inactive").toUpperCase()}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Application:{" "}
                          <span className="font-medium text-foreground">{businessUnit.application_name || businessUnit.code || "-"}</span>
                          {businessUnit.application_id && (
                            <span className="ml-2 text-xs">(ID: {businessUnit.application_id})</span>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="shrink-0 text-primary"
                        onClick={() => openEditDialog(businessUnit)}
                        aria-label={`Edit ${businessUnit.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <CircleUserRound className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Owner:</span>
                          <span className="truncate text-sm font-semibold">{businessUnit.owner_name || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Go-Live:</span>
                          <span className="text-sm font-semibold">{formatDate(businessUnit.go_live_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UsersRound className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Members:</span>
                          <span className="text-sm font-semibold">{businessUnit.members_count ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers3 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Consumers:</span>
                          <span className="text-sm font-semibold">{businessUnit.consumers_count ?? 0}</span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                        <Field label="Project SME" value={businessUnit.project_sme} />
                        <Field label="Tester" value={businessUnit.tester} />
                        <Field label="ServiceNow Group" value={businessUnit.servicenow_group} />
                        <Field label="Last Updated" value={formatDate(businessUnit.last_synced_at, "MMM d, yyyy")} />
                      </div>

                      {businessUnit.description && (
                        <p className="mt-4 text-sm text-muted-foreground">{businessUnit.description}</p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                        {tags.length > 0 ? (
                          tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1 font-normal">
                              <Tags className="h-3 w-3" />
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No tags added</span>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
                        <span>Created: {formatDate(businessUnit.created_at, "MMM d, yyyy")}</span>
                        <span className={`flex items-center gap-1 font-medium ${syncClasses[syncStatus] || syncClasses.pending}`}>
                          <BadgeCheck className="h-4 w-4" />
                          {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingBusinessUnit ? "Edit Business unit" : "Onboard Business unit"}</DialogTitle>
            <DialogDescription>
              {editingBusinessUnit ? "Update business unit details." : "Add a business unit for your approved organization."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Business unit Name" required value={formData.name} onChange={(value) => setFormData({ ...formData, name: value })} />
              <FormInput label="Business unit Code" value={formData.code} onChange={(value) => setFormData({ ...formData, code: value })} />
              <FormInput label="Application Name" value={formData.application_name} onChange={(value) => setFormData({ ...formData, application_name: value })} />
              <FormInput label="Application ID" value={formData.application_id} onChange={(value) => setFormData({ ...formData, application_id: value })} />
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select
                  value={formData.owner_name || noOwnerValue}
                  onValueChange={(value) => setFormData({ ...formData, owner_name: value === noOwnerValue ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noOwnerValue}>No owner</SelectItem>
                    {organizationUsers.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {formatUserOption(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <FormInput label="Go-Live Date" type="date" value={formData.go_live_date} onChange={(value) => setFormData({ ...formData, go_live_date: value })} />
              <FormInput label="Members" type="number" min="0" value={formData.members_count} onChange={(value) => setFormData({ ...formData, members_count: value })} />
              <FormInput label="Consumers" type="number" min="0" value={formData.consumers_count} onChange={(value) => setFormData({ ...formData, consumers_count: value })} />
              <FormInput label="Project SME" value={formData.project_sme} onChange={(value) => setFormData({ ...formData, project_sme: value })} />
              <FormInput label="Tester" value={formData.tester} onChange={(value) => setFormData({ ...formData, tester: value })} />
              <FormInput label="ServiceNow Group" value={formData.servicenow_group} onChange={(value) => setFormData({ ...formData, servicenow_group: value })} />
              <FormInput label="Last Synced" type="date" value={formData.last_synced_at} onChange={(value) => setFormData({ ...formData, last_synced_at: value })} />
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sync Status</Label>
                <Select value={formData.sync_status} onValueChange={(value) => setFormData({ ...formData, sync_status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="synced">Synced</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional notes about this Business unit"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Textarea
                placeholder="John Doe, Alice Brown, Demo 1"
                value={formData.tags}
                onChange={(event) => setFormData({ ...formData, tags: event.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Saving..." : editingBusinessUnit ? "Save Changes" : "Onboard Business unit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}:</p>
      <p className="mt-1 text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

function FormInput({ label, onChange, ...props }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input {...props} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
