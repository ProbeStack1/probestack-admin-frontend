import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Edit, Package, Plus, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "../lib/utils";
import OrganizationTabs from "../components/OrganizationTabs";

const unassignedBusinessUnit = "__unassigned__";

const emptyProject = {
  name: "",
  code: "",
  business_unit_id: "",
  description: "",
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
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState(emptyProject);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, []);

  const businessUnitNameById = useMemo(() => {
    return businessUnits.reduce((lookup, businessUnit) => {
      lookup[businessUnit.id] = businessUnit.name;
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
      setProjects(projectsResponse.data);
      setBusinessUnits(businessUnitsResponse.data);
      setTeamMembers(teamMembersResponse.data);
    } catch (error) {
      toast.error("Failed to load projects and business units");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    setFormData(emptyProject);
    setDialogOpen(true);
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || "",
      code: project.code || "",
      business_unit_id: project.business_unit_id || "",
      description: project.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      business_unit_id: formData.business_unit_id || null,
      description: formData.description.trim() || null,
    };

    try {
      if (editingProject) {
        await myOrganizationApi.updateProject(editingProject.id, payload);
        toast.success("Team updated successfully");
      } else {
        await myOrganizationApi.createProject(payload);
        toast.success("Team onboarded successfully");
      }

      setDialogOpen(false);
      setFormData(emptyProject);
      setEditingProject(null);
      fetchPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save team"));
    } finally {
      setProcessing(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const term = search.toLowerCase();
    const matchesSearch =
      project.name?.toLowerCase().includes(term) ||
      project.code?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term) ||
      businessUnitNameById[project.business_unit_id]?.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (businessUnitFilter === "all") return true;
    if (businessUnitFilter === unassignedBusinessUnit) return !project.business_unit_id;
    return project.business_unit_id === businessUnitFilter;
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

  return (
    <div className="space-y-6" data-testid="my-projects-page">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground mt-1">View team members across business units and applications</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Onboard Team
          </Button>
        </div>
        <OrganizationTabs />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <CardTitle>Team Members</CardTitle>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTeamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {teamSearch ? "No team members match your search" : "No team members invited yet"}
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeamMembers.map((member) => (
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => navigate("/onboard-bu")}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit BU
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Teams ({filteredProjects.length})
              </CardTitle>
              <CardDescription>Teams can be linked to a BU or kept unassigned</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select value={businessUnitFilter} onValueChange={setBusinessUnitFilter}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter by BU" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All BUs</SelectItem>
                  <SelectItem value={unassignedBusinessUnit}>Unassigned</SelectItem>
                  {businessUnits.map((businessUnit) => (
                    <SelectItem key={businessUnit.id} value={businessUnit.id}>
                      {businessUnit.name}
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
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || businessUnitFilter !== "all" ? "No teams match your filters" : "No teams onboarded yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>BU</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.business_unit_id ? businessUnitNameById[project.business_unit_id] || "Unknown BU" : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.code ? (
                          <Badge variant="outline" className="font-mono text-xs">{project.code}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={project.status === "active" ? "status-active" : "status-inactive"}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.created_at ? format(new Date(project.created_at), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/onboard-project/${project.id}/team`)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Team" : "Onboard Team"}</DialogTitle>
            <DialogDescription>
              {editingProject ? "Update team details." : "Add a team for your approved organization."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input
                placeholder="Platform Team"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Business Unit</Label>
              <Select
                value={formData.business_unit_id || unassignedBusinessUnit}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    business_unit_id: value === unassignedBusinessUnit ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select BU" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={unassignedBusinessUnit}>Unassigned</SelectItem>
                  {businessUnits.map((businessUnit) => (
                    <SelectItem key={businessUnit.id} value={businessUnit.id}>
                      {businessUnit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team Code</Label>
              <Input
                placeholder="PLATFORM"
                value={formData.code}
                onChange={(event) => setFormData({ ...formData, code: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional notes about this team"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Saving..." : editingProject ? "Save Changes" : "Onboard Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
