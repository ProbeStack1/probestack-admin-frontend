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
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Edit, Users, Search, Trash2, Plus } from "lucide-react";
import { getErrorMessage } from "../lib/utils";

export default function MyUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null, roleIds: [] });

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
    if (!roleDialog.user || roleDialog.roleIds.length === 0) return;
    try {
      await myOrganizationApi.updateUserRole(roleDialog.user.id, roleDialog.roleIds);
      toast.success("User roles updated");
      fetchUsers();
      setRoleDialog({ open: false, user: null, roleIds: [] });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update user roles"));
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

  const getAssignedRoleIds = (user) => {
    if (Array.isArray(user?.role_ids) && user.role_ids.length > 0) {
      return user.role_ids;
    }
    return user?.role_id ? [user.role_id] : [];
  };

  const getAssignedRoleNames = (user) => {
    if (Array.isArray(user?.role_names) && user.role_names.length > 0) {
      return user.role_names;
    }
    return user?.role_name ? [user.role_name] : [];
  };

  const addDialogRole = (roleId) => {
    setRoleDialog((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId) ? current.roleIds : [...current.roleIds, roleId],
    }));
  };

  const removeDialogRole = (roleId) => {
    setRoleDialog((current) => {
      if (current.roleIds.length <= 1) {
        toast.error("A user must have at least one role");
        return current;
      }
      return {
        ...current,
        roleIds: current.roleIds.filter((id) => id !== roleId),
      };
    });
  };

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
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {getAssignedRoleNames(user).map((roleName) => (
                            <Badge key={roleName} variant="secondary" className="max-w-[220px]">
                              <span className="truncate">{roleName}</span>
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.status === "active" ? "status-active" : "status-inactive"}>{user.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRoleDialog({ open: true, user, roleIds: getAssignedRoleIds(user) })}
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

      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ open, user: open ? roleDialog.user : null, roleIds: open ? roleDialog.roleIds : [] })}>
        <DialogContent data-testid="my-user-role-dialog">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>Add or remove roles for {roleDialog.user?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Assigned Roles</Label>
              <div className="space-y-2 rounded-md border p-3" data-testid="my-assigned-user-role-list">
                {roles
                  .filter((role) => roleDialog.roleIds.includes(role.id))
                  .map((role) => (
                    <div key={role.id} className="flex items-start justify-between gap-3 rounded-md px-2 py-2">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-none">{role.name}</span>
                        {role.description && (
                          <span className="mt-1 block text-xs text-muted-foreground">{role.description}</span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeDialogRole(role.id)}
                        disabled={roleDialog.roleIds.length <= 1}
                        data-testid={`my-remove-user-role-${role.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove role</span>
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Available Roles</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-3" data-testid="my-available-user-role-list">
                {roles.filter((role) => !roleDialog.roleIds.includes(role.id)).length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">All available roles are assigned.</p>
                ) : (
                  roles
                    .filter((role) => !roleDialog.roleIds.includes(role.id))
                    .map((role) => (
                      <div key={role.id} className="flex items-start justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-none">{role.name}</span>
                          {role.description && (
                            <span className="mt-1 block text-xs text-muted-foreground">{role.description}</span>
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => addDialogRole(role.id)}
                          data-testid={`my-add-user-role-${role.id}`}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, user: null, roleIds: [] })}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={roleDialog.roleIds.length === 0}>
              Save Roles
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
