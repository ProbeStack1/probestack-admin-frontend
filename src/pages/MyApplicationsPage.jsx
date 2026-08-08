import { useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { AppWindow, Edit, Plus, Search } from "lucide-react";
import OrganizationTabs from "../components/OrganizationTabs";
import OnboardingFormSections from "../components/OnboardingFormSections";
import { applicationSections, buildInitialData, buildPayloadFromData } from "../lib/onboardingFields";
import { getErrorMessage } from "../lib/utils";

const allProjectsValue = "__all_projects__";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState(allProjectsValue);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [formData, setFormData] = useState(buildInitialData(applicationSections));
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, []);

  const projectNameById = useMemo(() => {
    return projects.reduce((lookup, project) => {
      lookup[project.id] = project.name;
      return lookup;
    }, {});
  }, [projects]);

  const fetchPageData = async () => {
    try {
      const [applicationsResponse, projectsResponse] = await Promise.all([
        myOrganizationApi.getApplications(),
        myOrganizationApi.getProjects(),
      ]);
      setApplications(applicationsResponse.data);
      setProjects(projectsResponse.data);
    } catch (error) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingApplication(null);
    setFormData(buildInitialData(applicationSections));
    setDialogOpen(true);
  };

  const openEditDialog = (application) => {
    setEditingApplication(application);
    setFormData(buildInitialData(applicationSections, flattenApplication(application)));
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    const payload = buildPayloadFromData(applicationSections, formData);

    try {
      if (editingApplication) {
        await myOrganizationApi.updateApplication(editingApplication.id, payload);
        toast.success("Application updated successfully");
      } else {
        await myOrganizationApi.createApplication(payload);
        toast.success("Application added successfully");
      }
      setDialogOpen(false);
      setEditingApplication(null);
      setFormData(buildInitialData(applicationSections));
      fetchPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save application"));
    } finally {
      setProcessing(false);
    }
  };

  const filteredApplications = applications.filter((application) => {
    if (projectFilter !== allProjectsValue && application.project_id !== projectFilter) return false;
    const term = search.toLowerCase();
    return [
      application.application_name,
      application.display_name,
      application.description,
      application.business_capability,
      application.domain,
      application.application_type,
      application.runtime,
      application.language,
      projectNameById[application.project_id],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term);
  });

  return (
    <div className="space-y-6" data-testid="my-applications-page">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Application</h1>
            <p className="text-muted-foreground mt-1">Create and manage application onboarding fields</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        </div>
        <OrganizationTabs />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AppWindow className="h-5 w-5" />
                Applications ({filteredApplications.length})
              </CardTitle>
              <CardDescription>Applications are linked to projects and include API, AI, MCP, agent, monitoring, security, and billing details</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={allProjectsValue}>All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {search || projectFilter !== allProjectsValue ? "No applications match your filters" : "No applications added yet"}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredApplications.map((application) => (
                <div key={application.id} className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{application.display_name || application.application_name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {projectNameById[application.project_id] || "Unknown project"} - {application.application_id || application.id}
                      </p>
                    </div>
                    <Button variant="secondary" size="icon" onClick={() => openEditDialog(application)} aria-label="Edit application">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {application.application_type && <Badge variant="outline">{application.application_type}</Badge>}
                    {application.criticality && <Badge variant="outline">{application.criticality}</Badge>}
                    {application.runtime && <Badge variant="outline">{application.runtime}</Badge>}
                    {application.language && <Badge variant="outline">{application.language}</Badge>}
                  </div>
                  <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
                    <Field label="Base URL" value={application.base_url} />
                    <Field label="API Gateway" value={application.api_gateway} />
                    <Field label="LLM Provider" value={application.llm_provider} />
                    <Field label="Cost Center" value={application.billing?.cost_center} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingApplication ? "Edit Application" : "Add Application"}</DialogTitle>
            <DialogDescription>Complete the fields from the Application onboarding mapping.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <OnboardingFormSections
              sections={applicationSections}
              formData={formData}
              onChange={setFormData}
              projects={projects}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Saving..." : editingApplication ? "Save Changes" : "Add Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function flattenApplication(application) {
  return {
    ...application,
    ...(application.agent || {}),
    ...(application.monitoring || {}),
    ...(application.security || {}),
    ...(application.billing || {}),
  };
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value || "-"}</p>
    </div>
  );
}
