import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Users, Plus, Search, Trash2, ToggleLeft, ToggleRight, UserCog } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/utils";

export default function MyTeamPage() {
  const { admin } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, member: null });
  const [processing, setProcessing] = useState(false);
  
  const [newMember, setNewMember] = useState({
    email: "",
    password: "",
    name: "",
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await myOrganizationApi.getTeamMembers();
      setTeamMembers(response.data);
    } catch (error) {
      toast.error("Failed to load organization admins");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    
    setProcessing(true);
    try {
      await myOrganizationApi.createTeamMember(newMember);
      toast.success("Organization admin account created successfully");
      setCreateDialog(false);
      setNewMember({ email: "", password: "", name: "" });
      fetchTeamMembers();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Failed to create organization admin';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      await myOrganizationApi.toggleTeamMemberStatus(member.id);
      toast.success(`Account ${member.is_active ? "deactivated" : "activated"}`);
      fetchTeamMembers();
    } catch (error) {
      toast.error("Failed to update account status");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.member) return;
    
    setProcessing(true);
    try {
      await myOrganizationApi.deleteTeamMember(deleteDialog.member.id);
      toast.success("Organization admin removed successfully");
      fetchTeamMembers();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Failed to remove organization admin';
      toast.error(message);
    } finally {
      setProcessing(false);
      setDeleteDialog({ open: false, member: null });
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="my-team-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Organization Admins</h1>
          <p className="text-muted-foreground mt-1">
            Manage admin accounts for {admin?.organization_name}
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization Admin
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-border/50 bg-blue-500/5 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <UserCog className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Organization Admin Accounts</p>
              <p className="text-sm text-muted-foreground">
                Create additional admin accounts to share dashboard access for your organization.
                All organization admins will have the same permissions as you for managing your organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organization admins..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Organization Admins Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Admins ({filteredMembers.length})
          </CardTitle>
          <CardDescription>Admin accounts with access to your organization dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No organization admins match your search" : "No organization admins yet. Add your first organization admin!"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {member.name}
                          {member.id === admin?.id && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={member.is_active ? "status-active" : "status-inactive"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.id !== admin?.id && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={member.is_active ? "text-amber-500" : "text-green-500"}
                              onClick={() => handleToggleStatus(member)}
                              title={member.is_active ? "Deactivate" : "Activate"}
                            >
                              {member.is_active ? (
                                <ToggleRight className="h-4 w-4" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteDialog({ open: true, member })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Member Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Organization Admin</DialogTitle>
            <DialogDescription>
              Create a new admin account for your organization. They will have the same access as you.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMember} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newMember.password}
                onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Creating..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, member: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Organization Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteDialog.member?.name}</strong>'s account?
              They will no longer be able to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
