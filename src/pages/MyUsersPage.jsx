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
import { Edit, Users, Search, Trash2 } from "lucide-react";
import { getErrorMessage } from "../lib/utils";

export default function MyUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null, roleId: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        myOrganizationApi.getUsers(),
        myOrganizationApi.getRoles(),
      ]);
      setUsers(usersResponse.data);
      setRoles(rolesResponse.data || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!roleDialog.user || !roleDialog.roleId) return;
    try {
      await myOrganizationApi.updateUserRole(roleDialog.user.id, roleDialog.roleId);
      toast.success("User role updated");
      fetchUsers();
      setRoleDialog({ open: false, user: null, roleId: "" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update user role"));
    }
  };

  const handleRemoveUser = async () => {
    if (!deleteDialog.user) return;
    try {
      await myOrganizationApi.removeUser(deleteDialog.user.id);
      toast.success("User removed from organization");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to remove user");
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="my-users-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Organization Users</h1>
          <p className="text-muted-foreground mt-1">Manage users in your organization</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Users ({filteredUsers.length})</CardTitle>
              <CardDescription>All users in your organization</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.status === "active" ? "status-active" : "status-inactive"}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRoleDialog({ open: true, user, roleId: user.role_id || "" })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, user })}>
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ open, user: open ? roleDialog.user : null, roleId: open ? roleDialog.roleId : "" })}>
        <DialogContent data-testid="my-user-role-dialog">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update the role for {roleDialog.user?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={roleDialog.roleId} onValueChange={(roleId) => setRoleDialog({ ...roleDialog, roleId })}>
              <SelectTrigger data-testid="my-user-role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, user: null, roleId: "" })}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={!roleDialog.roleId}>
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove <strong>{deleteDialog.user?.name}</strong> from your organization?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive text-destructive-foreground">Remove User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
