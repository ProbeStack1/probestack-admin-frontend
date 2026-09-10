import { useEffect, useMemo, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "../lib/utils";
import OrganizationTabs from "../components/OrganizationTabs";
import PaginationControls, { usePagination } from "../components/PaginationControls";

const unassignedBusinessUnit = "__unassigned__";

const emptyProjectForm = {
  businessUnitId: "",
  name: "",
  code: "",
  ownerName: "",
  ownerEmail: "",
  description: "",
  status: "READY",
};

const getMemberName = (member) => member.name || member.user?.name || member.email?.split("@")[0] || "-";

const getMemberInitial = (member) => {
  const name = getMemberName(member);
  return name && name !== "-" ? name.charAt(0).toUpperCase() : "?";
};

const formatRole = (role) =>
  (role || "member")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function MyProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("all");
  const [formDialog, setFormDialog] = useState({ open: false, project: null, values: emptyProjectForm });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, project: null });

  useEffect(() => {
    fetchPageData();
  }, []);

  const businessUnitNameById = useMemo(() => {
    return businessUnits.reduce((lookup, businessUnit) => {
      lookup[businessUnit.id] = businessUnit.display_name || businessUnit.name;
      return lookup;
    }, {});
  }, [businessUnits]);

  const fetchPageData = async () => {
    try {
      const [projectsResponse, businessUnitsResponse, teamMembersResponse] = await Promise.all([
        myOrganizationApi.getProjects(),
        myOrganizationApi.getBusinessUnits(),
        myOrganizationApi.getProjectTeamMembers(),
      ]);
      setProjects(projectsResponse.data || []);
      setBusinessUnits(businessUnitsResponse.data || []);
      setTeamMembers(teamMembersResponse.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load projects and business units"));
    } finally {
      setLoading(false);
    }
  };

  const openFormDialog = (project = null) => {
    setFormDialog({
      open: true,
      project,
      values: project
        ? {
            businessUnitId: project.business_unit_id || project.businessUnitId || "",
            name: project.name || "",
            code: project.code || "",
            ownerName: project.owner_name || project.ownerName || "",
            ownerEmail: project.owner_email || project.ownerEmail || "",
            description: project.description || "",
            status: (project.status || "READY").toUpperCase(),
          }
        : { ...emptyProjectForm },
    });
  };

  const updateFormValue = (field, value) => {
    setFormDialog((current) => ({
      ...current,
      values: { ...current.values, [field]: value },
    }));
  };

  const closeFormDialog = () => {
    setFormDialog({ open: false, project: null, values: emptyProjectForm });
  };

  const handleSaveProject = async () => {
    const values = formDialog.values;
    if (!values.businessUnitId || !values.name.trim() || !values.code.trim()) {
      toast.error("Business unit, name, and code are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        businessUnitId: values.businessUnitId,
        name: values.name.trim(),
        code: values.code.trim(),
        ownerName: values.ownerName.trim() || undefined,
        ownerEmail: values.ownerEmail.trim() || undefined,
        description: values.description.trim() || undefined,
        status: values.status,
      };
      if (formDialog.project) {
        await myOrganizationApi.updateProject(formDialog.project.id, payload);
        toast.success("Project updated");
      } else {
        await myOrganizationApi.createProject(payload);
        toast.success("Project created");
      }
      closeFormDialog();
      await fetchPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save project"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteDialog.project) return;
    try {
      await myOrganizationApi.deleteProject(deleteDialog.project.id);
      toast.success("Project deleted");
      await fetchPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete project"));
    } finally {
      setDeleteDialog({ open: false, project: null });
    }
  };

  const filteredProjects = projects.filter((project) => {
    const term = search.toLowerCase();
    const businessUnitId = project.business_unit_id || project.businessUnitId;
    const matchesSearch =
      project.name?.toLowerCase().includes(term) ||
      project.code?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term) ||
      project.owner_name?.toLowerCase().includes(term) ||
      businessUnitNameById[businessUnitId]?.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (businessUnitFilter === "all") return true;
    if (businessUnitFilter === unassignedBusinessUnit) return !businessUnitId;
    return businessUnitId === businessUnitFilter;
  });

  const filteredTeamMembers = teamMembers.filter((member) => {
    const term = teamSearch.toLowerCase();
    const searchable = [
      getMemberName(member),
      member.email,
      member.project_role,
      member.business_unit_name,
      member.business_unit?.name,
      member.project?.name,
      member.application_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchable.includes(term);
  });
  const teamMembersPagination = usePagination(filteredTeamMembers);
  const projectsPagination = usePagination(filteredProjects);

  return (
    <div className="space-y-6" data-testid="my-projects-page">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Project</h1>
            <p className="text-muted-foreground mt-1">Manage projects and view project members</p>
          </div>
          <Button onClick={() => openFormDialog()} className="w-full sm:w-auto" disabled={businessUnits.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>
        <OrganizationTabs />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <CardTitle>Project Members</CardTitle>
              <CardDescription>{filteredTeamMembers.length} member(s) across all business units</CardDescription>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredTeamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {teamSearch ? "No project members match your search" : "No project members invited yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Application</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembersPagination.pageItems.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-900/50 text-sm font-semibold text-orange-100">
                            {getMemberInitial(member)}
                          </div>
                          <div>
                            <p className="font-semibold">{getMemberName(member)}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
                          {formatRole(member.project_role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {member.business_unit_name || member.business_unit?.name || member.project?.name || "-"}
                      </TableCell>
                      <TableCell>{member.application_name || member.business_unit?.application_name || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls {...teamMembersPagination} onPageChange={teamMembersPagination.setPage} />
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Projects ({filteredProjects.length})
              </CardTitle>
              <CardDescription>Create, update, and delete onboarding projects</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter by Business unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business units</SelectItem>
                  <SelectItem value={unassignedBusinessUnit}>Unassigned</SelectItem>
                  {businessUnits.map((businessUnit) => (
                    <SelectItem key={businessUnit.id} value={businessUnit.id}>
                      {businessUnit.display_name || businessUnit.name}
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
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || businessUnitFilter !== "all" ? "No projects match your filters" : "No projects onboarded yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Business Unit</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsPagination.pageItems.map((project) => {
                    const businessUnitId = project.business_unit_id || project.businessUnitId;
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {project.code && <Badge variant="outline" className="font-mono text-xs">{project.code}</Badge>}
                              {project.description && <span className="text-xs text-muted-foreground line-clamp-1">{project.description}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {businessUnitId ? businessUnitNameById[businessUnitId] || "Unknown Business unit" : (
                            <span className="text-xs text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>{project.owner_name || project.ownerName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={project.status === "active" || project.status === "ready" ? "status-active" : "status-inactive"}>
                            {project.status || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {project.created_at ? format(new Date(project.created_at), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openFormDialog(project)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit project</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteDialog({ open: true, project })}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete project</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls {...projectsPagination} onPageChange={projectsPagination.setPage} />
        </CardContent>
      </Card>

      <Dialog open={formDialog.open} onOpenChange={(open) => (open ? null : closeFormDialog())}>
        <DialogContent className="sm:max-w-2xl" data-testid="project-form-dialog">
          <DialogHeader>
            <DialogTitle>{formDialog.project ? "Edit Project" : "Add Project"}</DialogTitle>
            <DialogDescription>{formDialog.project ? "Update onboarding project details." : "Create an onboarding project under a business unit."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Business Unit</Label>
              <Select value={formDialog.values.businessUnitId} onValueChange={(value) => updateFormValue("businessUnitId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business unit" />
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((businessUnit) => (
                    <SelectItem key={businessUnit.id} value={businessUnit.id}>
                      {businessUnit.display_name || businessUnit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormField label="Name" value={formDialog.values.name} onChange={(value) => updateFormValue("name", value)} />
            <FormField label="Code" value={formDialog.values.code} onChange={(value) => updateFormValue("code", value)} />
            <FormField label="Owner Name" value={formDialog.values.ownerName} onChange={(value) => updateFormValue("ownerName", value)} />
            <FormField label="Owner Email" value={formDialog.values.ownerEmail} onChange={(value) => updateFormValue("ownerEmail", value)} />
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formDialog.values.status} onValueChange={(value) => updateFormValue("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={formDialog.values.description} onChange={(event) => updateFormValue("description", event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFormDialog} disabled={saving}>Cancel</Button>
            <Button onClick={handleSaveProject} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, project: open ? deleteDialog.project : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteDialog.project?.name}</strong> from onboarding?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">
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
