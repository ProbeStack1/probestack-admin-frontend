import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Building2, Edit, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "../lib/utils";
import OrganizationTabs from "../components/OrganizationTabs";
import OnboardingFormSections from "../components/OnboardingFormSections";
import { buildInitialData, buildPayloadFromData, businessUnitSections } from "../lib/onboardingFields";
import PaginationControls, { usePagination } from "../components/PaginationControls";

const statusClasses = {
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  inactive: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  archived: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export default function MyBusinessUnitsPage() {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBusinessUnit, setEditingBusinessUnit] = useState(null);
  const [formData, setFormData] = useState(buildInitialData(businessUnitSections));
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBusinessUnits();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const response = await myOrganizationApi.getBusinessUnits({ include_projects: true });
      setBusinessUnits(response.data);
    } catch (error) {
      toast.error("Failed to load business units");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingBusinessUnit(null);
    setFormData(buildInitialData(businessUnitSections));
    setDialogOpen(true);
  };

  const openEditDialog = (businessUnit) => {
    setEditingBusinessUnit(businessUnit);
    setFormData(buildInitialData(businessUnitSections, businessUnit));
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    const payload = {
      ...buildPayloadFromData(businessUnitSections, formData),
      status: editingBusinessUnit?.status || "active",
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
      setEditingBusinessUnit(null);
      setFormData(buildInitialData(businessUnitSections));
      fetchBusinessUnits();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save business unit"));
    } finally {
      setProcessing(false);
    }
  };

  const filteredBusinessUnits = businessUnits.filter((businessUnit) => {
    const term = search.toLowerCase();
    return [
      businessUnit.name,
      businessUnit.code,
      businessUnit.display_name,
      businessUnit.description,
      businessUnit.division,
      businessUnit.department,
      businessUnit.line_of_business,
      businessUnit.owner_name,
      businessUnit.cost_center,
      businessUnit.cloud_provider,
      businessUnit.region,
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
            <p className="text-muted-foreground mt-1">Create and manage business unit onboarding fields</p>
          </div>
          <Button onClick={openCreateDialog}>
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
              <CardDescription>Fields follow the Business Unit section in onboarding_field_mapping.xlsx</CardDescription>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                    <Button variant="secondary" size="icon" onClick={() => openEditDialog(businessUnit)} aria-label="Edit business unit">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                    <Field label="Division" value={businessUnit.division} />
                    <Field label="Line of Business" value={businessUnit.line_of_business} />
                    <Field label="Cost Center" value={businessUnit.cost_center} />
                    <Field label="SLA Tier" value={businessUnit.sla_tier} />
                    <Field label="Cloud Provider" value={businessUnit.cloud_provider} />
                    <Field label="Updated" value={businessUnit.updated_at ? format(new Date(businessUnit.updated_at), "MMM d, yyyy") : "-"} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls {...businessUnitsPagination} onPageChange={businessUnitsPagination.setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingBusinessUnit ? "Edit Business Unit" : "Add Business Unit"}</DialogTitle>
            <DialogDescription>Complete the fields from the Business Unit onboarding mapping.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <OnboardingFormSections sections={businessUnitSections} formData={formData} onChange={setFormData} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Saving..." : editingBusinessUnit ? "Save Changes" : "Add Business Unit"}
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value || "-"}</p>
    </div>
  );
}
