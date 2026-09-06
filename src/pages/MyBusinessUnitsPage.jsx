import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
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
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "../lib/utils";
import OrganizationTabs from "../components/OrganizationTabs";
import PaginationControls, { usePagination } from "../components/PaginationControls";

const emptyBusinessUnitForm = {
  name: "",
  code: "",
  displayName: "",
  ownerName: "",
  ownerEmail: "",
  description: "",
  status: "ACTIVE",
};

const statusClasses = {
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  inactive: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  archived: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export default function MyBusinessUnitsPage() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [formDialog, setFormDialog] = useState({ open: false, businessUnit: null, values: emptyBusinessUnitForm });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, businessUnit: null });

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const response = await myOrganizationApi.getBusinessUnits({ include_projects: true });
      setBusinessUnits(response.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load business units"));
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = (businessUnit = null) => {
    setFormDialog({
      open: true,
      businessUnit,
      values: businessUnit
        ? {
            name: businessUnit.name || "",
            code: businessUnit.code || "",
            displayName: businessUnit.display_name || businessUnit.displayName || "",
            ownerName: businessUnit.owner_name || businessUnit.ownerName || "",
            ownerEmail: businessUnit.owner_email || businessUnit.ownerEmail || "",
            description: businessUnit.description || "",
            status: (businessUnit.status || "ACTIVE").toUpperCase(),
          }
        : { ...emptyBusinessUnitForm },
    });
  };

  const updateFormValue = (field, value) => {
    setFormDialog((current) => ({
      ...current,
      values: { ...current.values, [field]: value },
    }));
  };

  const closeFormDialog = () => {
    setFormDialog({ open: false, businessUnit: null, values: emptyBusinessUnitForm });
  };

  const handleSaveBusinessUnit = async () => {
    const values = formDialog.values;
    if (!values.name.trim() || !values.code.trim()) {
      toast.error("Name and code are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim(),
        displayName: values.displayName.trim() || values.name.trim(),
        ownerName: values.ownerName.trim() || undefined,
        ownerEmail: values.ownerEmail.trim() || undefined,
        description: values.description.trim() || undefined,
        status: values.status,
      };
      if (formDialog.businessUnit) {
        await myOrganizationApi.updateBusinessUnit(formDialog.businessUnit.id, payload);
        toast.success("Business unit updated");
      } else {
        await myOrganizationApi.createBusinessUnit(payload);
        toast.success("Business unit created");
      }
      closeFormDialog();
      await fetchBusinessUnits();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save business unit"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBusinessUnit = async () => {
    if (!deleteDialog.businessUnit) return;
    try {
      await myOrganizationApi.deleteBusinessUnit(deleteDialog.businessUnit.id);
      toast.success("Business unit deleted");
      await fetchBusinessUnits();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete business unit"));
    } finally {
      setDeleteDialog({ open: false, businessUnit: null });
    }
  };

  const filteredBusinessUnits = businessUnits.filter((businessUnit) => {
    const term = search.toLowerCase();
    return [
      businessUnit.name,
      businessUnit.code,
      businessUnit.display_name,
      businessUnit.description,
      businessUnit.owner_name,
      businessUnit.owner_email,
      businessUnit.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term);
  });
  const businessUnitsPagination = usePagination(filteredBusinessUnits);

  return (
    <div className="space-y-6" data-testid="my-business-units-page">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Business Unit</h1>
            <p className="text-muted-foreground mt-1">Manage business units from onboarding</p>
          </div>
          <Button onClick={() => openFormDialog()} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Business Unit
          </Button>
        </div>
        <OrganizationTabs />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Units ({filteredBusinessUnits.length})
              </CardTitle>
              <CardDescription>Create, update, and delete onboarding business units</CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredBusinessUnits.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {search ? "No business units match your search" : "No business units onboarded yet"}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {businessUnitsPagination.pageItems.map((businessUnit) => (
                <div key={businessUnit.id} className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold">{businessUnit.display_name || businessUnit.name}</h2>
                        <Badge variant="outline" className={statusClasses[businessUnit.status] || statusClasses.inactive}>
                          {businessUnit.status || "inactive"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {businessUnit.code || "No code"} {businessUnit.business_unit_id ? `- ${businessUnit.business_unit_id}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openFormDialog(businessUnit)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit business unit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, businessUnit })}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete business unit</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                    <Field label="Owner" value={businessUnit.owner_name || businessUnit.ownerName} />
                    <Field label="Owner Email" value={businessUnit.owner_email || businessUnit.ownerEmail} />
                    <Field label="Projects" value={Array.isArray(businessUnit.projects) ? businessUnit.projects.length : 0} />
                    <Field label="Updated" value={businessUnit.updated_at ? format(new Date(businessUnit.updated_at), "MMM d, yyyy") : "-"} />
                  </div>
                  {businessUnit.description && (
                    <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">{businessUnit.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <PaginationControls {...businessUnitsPagination} onPageChange={businessUnitsPagination.setPage} />
        </CardContent>
      </Card>

      <Dialog open={formDialog.open} onOpenChange={(open) => (open ? null : closeFormDialog())}>
        <DialogContent className="sm:max-w-2xl" data-testid="business-unit-form-dialog">
          <DialogHeader>
            <DialogTitle>{formDialog.businessUnit ? "Edit Business Unit" : "Add Business Unit"}</DialogTitle>
            <DialogDescription>{formDialog.businessUnit ? "Update onboarding business unit details." : "Create an onboarding business unit."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <FormField label="Name" value={formDialog.values.name} onChange={(value) => updateFormValue("name", value)} />
            <FormField label="Code" value={formDialog.values.code} onChange={(value) => updateFormValue("code", value)} />
            <FormField label="Display Name" value={formDialog.values.displayName} onChange={(value) => updateFormValue("displayName", value)} />
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formDialog.values.status} onValueChange={(value) => updateFormValue("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField label="Owner Name" value={formDialog.values.ownerName} onChange={(value) => updateFormValue("ownerName", value)} />
            <FormField label="Owner Email" value={formDialog.values.ownerEmail} onChange={(value) => updateFormValue("ownerEmail", value)} />
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={formDialog.values.description} onChange={(event) => updateFormValue("description", event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFormDialog} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveBusinessUnit} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, businessUnit: open ? deleteDialog.businessUnit : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteDialog.businessUnit?.display_name || deleteDialog.businessUnit?.name}</strong> from onboarding?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBusinessUnit} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FormField({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || value === 0 ? value : "-"}</p>
    </div>
  );
}
