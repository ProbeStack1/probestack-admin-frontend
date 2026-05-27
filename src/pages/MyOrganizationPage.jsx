import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Building2, Globe2, Mail, Phone, UserRound } from "lucide-react";
import OrganizationTabs from "../components/OrganizationTabs";

const formatValue = (value) => value || "-";

export default function MyOrganizationPage() {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await myOrganizationApi.getOrganization();
      setOrganization(response.data);
    } catch (error) {
      toast.error("Failed to load organization details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="my-organization-page">
      <OrganizationTabs />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>Approved organization profile for this admin account</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !organization ? (
            <div className="text-center py-8 text-muted-foreground">Organization details are not available</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold">{organization.name}</h1>
                    <p className="text-sm text-muted-foreground">{organization.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className={organization.status === "approved" ? "status-approved" : "status-pending"}>
                  {organization.status || "unknown"}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Detail icon={Mail} label="Email" value={organization.email} />
                <Detail icon={Globe2} label="Domain" value={organization.domain} />
                <Detail icon={UserRound} label="Contact Person" value={organization.contact_person} />
                <Detail icon={Phone} label="Phone" value={organization.phone} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Subscription Request">
                  <DetailText label="Requested Plan" value={organization.requested_plan} />
                  <DetailText label="Requested Tools" value={(organization.requested_tools || []).join(", ")} />
                </Panel>
                <Panel title="System IDs">
                  <DetailText label="External Org ID" value={organization.external_org_id} />
                  <DetailText label="Auth0 Org ID" value={organization.auth0_org_id} />
                </Panel>
                <Panel title="Gateway Onboarding">
                  <DetailText label="Region" value={organization.gateway_region} />
                  <DetailText label="Gateway Organization Name" value={organization.gateway_organization_name} />
                  <DetailText label="Environment Type" value={organization.gateway_environment_type} />
                  <DetailText label="Environments" value={(organization.gateway_environments || []).join(", ")} />
                </Panel>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 font-medium">{formatValue(value)}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function DetailText({ label, value }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{formatValue(value)}</p>
    </div>
  );
}
