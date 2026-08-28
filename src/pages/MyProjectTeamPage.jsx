import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
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
import { getErrorMessage } from "../lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Mail, Send, Users } from "lucide-react";
import { format } from "date-fns";
import PaginationControls, { usePagination } from "../components/PaginationControls";

export default function MyProjectTeamPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [team, setTeam] = useState([]);
  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [projectRole, setProjectRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, [projectId]);

  const existingMemberEmails = useMemo(
    () => new Set(team.filter((member) => member.status !== "removed").map((member) => member.email)),
    [team]
  );
  const teamPagination = usePagination(team);

  const fetchPageData = async () => {
    try {
      const [projectResponse, teamResponse, orgResponse, usersResponse] = await Promise.all([
        myOrganizationApi.getProjectById(projectId),
        myOrganizationApi.getProjectTeam(projectId),
        myOrganizationApi.getOrganization(),
        myOrganizationApi.getUsers(),
      ]);
      setProject(projectResponse.data);
      setTeam(teamResponse.data);
      setOrganization(orgResponse.data);
      setOrganizationUsers(usersResponse.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load project members"));
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (email) => {
    setSelectedEmails((current) =>
      current.includes(email)
        ? current.filter((item) => item !== email)
        : [...current, email]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedEmails.length === 0) {
      toast.error("Select at least one organization user");
      return;
    }

    setSubmitting(true);
    try {
      const response = await myOrganizationApi.inviteProjectTeam(projectId, {
        emails: selectedEmails,
        project_role: projectRole,
      });
      const skipped = response.data?.skipped || [];
      toast.success(response.data?.message || "Project invitations sent");
      if (skipped.length > 0) {
        toast.info(`${skipped.length} email(s) were already invited`);
      }
      setSelectedEmails([]);
      fetchPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to invite project members"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="my-project-team-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/onboard-project")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Invite Project Members</h1>
          <p className="text-muted-foreground mt-1">{project?.name || "Project"} access</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Members
          </CardTitle>
          <CardDescription>
            Select users that already exist in {organization?.name || "this organization"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Users</Label>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3">
                {organizationUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users are available in this organization.</p>
                ) : (
                  organizationUsers.map((user) => {
                    const alreadyMember = existingMemberEmails.has(user.email);
                    return (
                      <label
                        key={user.id}
                        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                          alreadyMember ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Checkbox
                            checked={selectedEmails.includes(user.email)}
                            disabled={alreadyMember}
                            onCheckedChange={() => toggleUser(user.email)}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        {alreadyMember && <Badge variant="secondary">Added</Badge>}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project Role</Label>
              <Select value={projectRole} onValueChange={setProjectRole}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select project role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Project Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Inviting..." : "Invite Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Members ({team.length})
          </CardTitle>
          <CardDescription>Invited and active members for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No project members invited yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Project Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPagination.pageItems.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name || member.user?.name || "-"}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="capitalize">{member.project_role}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            member.status === "active"
                              ? "status-active"
                              : member.status === "removed"
                              ? "status-rejected"
                              : "status-pending"
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.invited_at ? format(new Date(member.invited_at), "MMM d, yyyy") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls {...teamPagination} onPageChange={teamPagination.setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
