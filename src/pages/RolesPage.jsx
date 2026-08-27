import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { rolesApi } from "../lib/api";
import { toast } from "sonner";
import { Edit, MoreVertical, Plus, Shield, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "../lib/utils";

const emptyForm = {
  name: "",
  description: "",
  permissions: "",
};

const permissionsToText = (permissions = []) => permissions.join("\n");

const textToPermissions = (value) =>
  value
    .split(/\r?\n|,/)
    .map((permission) => permission.trim())
    .filter(Boolean);

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      setRoles(response.data || []);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return format(new Date(value), "MMM d, yyyy");
  };

  const openCreateDialog = () => {
    setSelectedRole(null);
    setFormData(emptyForm);
    setShowRoleDialog(true);
  };

  const openEditDialog = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || "",
      description: role.description || "",
      permissions: permissionsToText(role.permissions || []),
    });
    setShowRoleDialog(true);
  };

  const handleSaveRole = async () => {
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      permissions: textToPermissions(formData.permissions),
    };
    if (!payload.name) {
      toast.error("Role name is required");
      return;
    }

    setSaving(true);
    try {
      if (selectedRole) {
        await rolesApi.update(selectedRole.id, payload);
        toast.success("Role updated");
      } else {
        await rolesApi.create(payload);
        toast.success("Role created");
      }
      await fetchRoles();
      setShowRoleDialog(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save role"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await rolesApi.delete(selectedRole.id);
      toast.success("Role deleted");
      await fetchRoles();
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete role"));
    } finally {
      setSaving(false);
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
    <div className="space-y-6 animate-fade-in" data-testid="roles-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground mt-1">Global role catalog and product permissions</p>
        </div>
        <Button onClick={openCreateDialog} data-testid="create-role-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No roles found</h3>
              <p className="text-muted-foreground text-sm mt-1">Add a role to start building the global catalog.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{role.name}</p>
                            <Badge variant="secondary" className="text-xs">Global</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{role.description || "No description"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).slice(0, 4).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">{permission}</Badge>
                        ))}
                        {(role.permissions || []).length > 4 && (
                          <Badge variant="secondary" className="text-xs">+{role.permissions.length - 4}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(role.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(role)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedRole(role);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent data-testid="role-dialog">
          <DialogHeader>
            <DialogTitle>{selectedRole ? "Edit Role" : "Add Role"}</DialogTitle>
            <DialogDescription>Manage the role name, description, and permission keys.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="API Reviewer"
                data-testid="role-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                rows={2}
                placeholder="Short description of what this role can do"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <Textarea
                value={formData.permissions}
                onChange={(event) => setFormData({ ...formData, permissions: event.target.value })}
                rows={6}
                placeholder={"forgecatalog:view\nforgesphere:edit\nforgefuzz:admin"}
                data-testid="role-permissions-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving} data-testid="save-role-btn">
              {saving ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-role-dialog">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Delete {selectedRole?.name}? Roles assigned to users cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={saving}>
              {saving ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
