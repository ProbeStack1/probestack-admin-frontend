import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { rolesApi, organizationsApi } from "../lib/api";
import { toast } from "sonner";
import { Shield, Plus, MoreVertical, Edit, Trash2, Building2 } from "lucide-react";
import { format } from "date-fns";

const PERMISSIONS = [
  { id: "read", label: "Read", description: "View resources" },
  { id: "write", label: "Write", description: "Create and edit resources" },
  { id: "delete", label: "Delete", description: "Delete resources" },
  { id: "admin", label: "Admin", description: "Full admin access" },
  { id: "billing", label: "Billing", description: "Manage billing" },
  { id: "users", label: "Users", description: "Manage users" },
  { id: "settings", label: "Settings", description: "Manage settings" },
  { id: "api", label: "API Access", description: "API access" },
];

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    organization_id: "",
    permissions: [],
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, [selectedOrg]);

  const fetchData = async () => {
    try {
      const [rolesRes, orgsRes] = await Promise.all([
        rolesApi.getAll(selectedOrg !== "all" ? { organization_id: selectedOrg } : {}),
        organizationsApi.getAll({ status: "approved" }),
      ]);
      setRoles(rolesRes.data);
      setOrganizations(orgsRes.data);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await rolesApi.create(formData);
      toast.success("Role created successfully");
      fetchData();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleUpdate = async () => {
    if (!selectedRole) return;
    try {
      await rolesApi.update(selectedRole.id, formData);
      toast.success("Role updated successfully");
      fetchData();
      setShowEditDialog(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      await rolesApi.delete(selectedRole.id);
      toast.success("Role deleted successfully");
      fetchData();
      setShowDeleteDialog(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  const openEditDialog = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      organization_id: role.organization_id,
      permissions: role.permissions || [],
      description: role.description || "",
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({ name: "", organization_id: "", permissions: [], description: "" });
    setSelectedRole(null);
  };

  const togglePermission = (permId) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const getOrgName = (orgId) => {
    const org = organizations.find((o) => o.id === orgId);
    return org?.name || "Unknown";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground mt-1">Manage roles and permissions</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filter by organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No roles found</h3>
              <p className="text-muted-foreground text-sm mt-1">Create roles to manage user permissions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
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
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getOrgName(role.organization_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).slice(0, 3).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                        ))}
                        {(role.permissions || []).length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{role.permissions.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(role.created_at), "MMM d, yyyy")}
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
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedRole(role); setShowDeleteDialog(true); }} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Delete
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

      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setShowEditDialog(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription>{showEditDialog ? "Update the role details" : "Define a new role with permissions"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input placeholder="e.g., Developer" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={formData.organization_id} onValueChange={(value) => setFormData({ ...formData, organization_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Select org" /></SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                {PERMISSIONS.map((perm) => (
                  <div key={perm.id} className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-muted/50">
                    <Checkbox id={perm.id} checked={formData.permissions.includes(perm.id)} onCheckedChange={() => togglePermission(perm.id)} />
                    <label htmlFor={perm.id} className="flex-1 cursor-pointer text-sm font-medium">
                      {perm.label}
                      <p className="text-xs font-normal text-muted-foreground">{perm.description}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={showEditDialog ? handleUpdate : handleCreate}>{showEditDialog ? "Update Role" : "Create Role"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>Are you sure you want to delete this role?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
