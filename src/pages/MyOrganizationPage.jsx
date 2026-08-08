import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";
import OrganizationTabs from "../components/OrganizationTabs";
import OnboardingFormSections from "../components/OnboardingFormSections";
import { buildInitialData, buildPayloadFromData, organizationSections } from "../lib/onboardingFields";
import { getErrorMessage } from "../lib/utils";

export default function MyOrganizationPage() {
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState(buildInitialData(organizationSections));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await myOrganizationApi.getOrganization();
      setOrganization(response.data);
      setFormData(buildInitialData(organizationSections, response.data));
    } catch (error) {
      toast.error("Failed to load organization details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = buildPayloadFromData(organizationSections, formData);
      const response = await myOrganizationApi.updateOrganization(payload);
      setOrganization(response.data.organization);
      setFormData(buildInitialData(organizationSections, response.data.organization));
      toast.success("Organization fields updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update organization"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="my-organization-page">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Organization</h1>
            <p className="text-muted-foreground mt-1">Manage the organization fields from the onboarding mapping</p>
          </div>
          {organization && (
            <Badge variant="outline" className={organization.status === "approved" ? "status-approved" : "status-pending"}>
              {organization.status || "unknown"}
            </Badge>
          )}
        </div>
        <OrganizationTabs />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Fields
          </CardTitle>
          <CardDescription>Fields are grouped the same way as onboarding_field_mapping.xlsx</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !organization ? (
            <div className="text-center py-8 text-muted-foreground">Organization details are not available</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <OnboardingFormSections
                sections={organizationSections}
                formData={formData}
                onChange={setFormData}
              />
              <div className="flex justify-end border-t pt-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Organization"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
