import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
import { myOrganizationApi } from "../lib/api";
import { getErrorMessage } from "../lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Mail, Send, Users } from "lucide-react";
import { format } from "date-fns";

export default function MyProjectTeamPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [team, setTeam] = useState([]);
  const [emails, setEmails] = useState("");
  const [projectRole, setProjectRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPageData();
  }, [projectId]);

  const allowedDomains = useMemo(() => {
    const domains = new Set();
    (organization?.supported_domains || []).forEach((domain) => {
      if (domain) domains.add(domain.startsWith("@") ? domain : `@${domain}`);
    });
    if (organization?.domain) {
      domains.add(organization.domain.startsWith("@") ? organization.domain : `@${organization.domain}`);
    }
    return Array.from(domains);
  }, [organization]);

  const fetchPageData = async () => {
    try {
      const [projectResponse, teamResponse, orgResponse] = await Promise.all([
        myOrganizationApi.getProjectById(projectId),
        myOrganizationApi.getProjectTeam(projectId),
        myOrganizationApi.getOrganization(),
      ]);
      setProject(projectResponse.data);
      setTeam(teamResponse.data);
      setOrganization(orgResponse.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load team members"));
    } finally {
      setLoading(false);
    }
  };

  const parseEmails = () => {
    return emails
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedEmails = parseEmails();
    if (parsedEmails.length === 0) {
      toast.error("Enter at least one email address");
      return;
    }

    setSubmitting(true);
    try {
      const response = await myOrganizationApi.inviteProjectTeam(projectId, {
        emails: parsedEmails,
        project_role: projectRole,
      });
      const skipped = response.data?.skipped || [];
      toast.success(response.data?.message || "Team invitations sent");
      if (skipped.length > 0) {
        toast.info(`${skipped.length} email(s) were already invited`);
      }
      setEmails("");
      fetchPageData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to invite team members"));
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Invite Team Members</h1>
          <p className="text-muted-foreground mt-1">{project?.name || "Team"} access</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Members
          </CardTitle>
          <CardDescription>
            Only emails from {allowedDomains.length ? allowedDomains.join(", ") : "configured organization domains"} are accepted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email IDs</Label>
              <Textarea
                placeholder="name@company.com, teammate@company.com"
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Team Role</Label>
              <Select value={projectRole} onValueChange={setProjectRole}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select project role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Team Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Inviting..." : "Invite Team"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({team.length})
          </CardTitle>
          <CardDescription>Invited and active members for this team</CardDescription>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No team members invited yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Team Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.map((member) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
