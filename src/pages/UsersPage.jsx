import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { usersApi, organizationsApi, rolesApi } from "../lib/api";
import { toast } from "sonner";
import { Users, Search, MoreVertical, UserPlus, Trash2, Ban, CheckCircle, Building2, Shield, Edit } from "lucide-react";
import { format } from "date-fns";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { getErrorMessage } from "../lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    organization_id: "",
    role_id: "",
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [usersRes, orgsRes, rolesRes] = await Promise.all([
        usersApi.getAll(statusFilter !== "all" ? { status: statusFilter } : {}),
        organizationsApi.getAll({ status: "approved" }),
        rolesApi.getAll(),
      ]);
      setUsers(usersRes.data);
      setOrganizations(orgsRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await usersApi.create(formData);
      toast.success("User created successfully");
      fetchData();
      setShowCreateDialog(false);
      setFormData({ email: "", name: "", organization_id: "", role_id: "" });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create user"));
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    try {
      await usersApi.updateStatus(user.id, newStatus);
      toast.success(`User ${newStatus === "active" ? "activated" : "suspended"}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.delete(selectedUser.id);
      toast.success("User deleted successfully");
      fetchData();
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setSelectedRoleIds(getAssignedRoleIds(user));
    setShowRoleDialog(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || selectedRoleIds.length === 0) return;
    try {
      await usersApi.updateRole(selectedUser.id, selectedRoleIds);
      toast.success("User roles updated");
      fetchData();
      setShowRoleDialog(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update user roles"));
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const classes = {
      active: "status-active",
      inactive: "status-paused",
      suspended: "status-rejected",
    };
    return (
      <Badge variant="outline" className={classes[status] || ""}>
        {status}
      </Badge>
    );
  };

  const getAvailableRoles = (orgId) => {
    const matchingRoles = roles.filter((role) => !role.organization_id || role.organization_id === orgId);
    return Array.from(
      matchingRoles
        .reduce((roleMap, role) => {
          const key = role.name || role.id;
          const existing = roleMap.get(key);
          if (!existing || (!role.organization_id && existing.organization_id)) {
            roleMap.set(key, role);
          }
          return roleMap;
        }, new Map())
        .values()
    );
  };

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

  const toggleSelectedRole = (roleId) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage users across all organizations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-user-btn">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50" data-testid="users-table">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No users found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Users will appear here when added to organizations
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.organization_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {getAssignedRoleNames(user).map((roleName) => (
                          <Badge key={roleName} variant="secondary" className="max-w-[220px]">
                            <Shield className="mr-1 h-3 w-3 shrink-0" />
                            <span className="truncate">{roleName}</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status !== "active" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user, "active")}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.status === "active" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(user, "suspended")}>
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openRoleDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Manage Roles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setSelectedUser(user); setShowDeleteDialog(true); }}
                            className="text-destructive"
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="create-dialog">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Add a user to an organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="user-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="user-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select
                value={formData.organization_id}
                onValueChange={(value) => setFormData({ ...formData, organization_id: value, role_id: "" })}
              >
                <SelectTrigger data-testid="user-org-select">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                disabled={!formData.organization_id}
              >
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles(formData.organization_id).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} data-testid="save-user-btn">
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog
        open={showRoleDialog}
        onOpenChange={(open) => {
          setShowRoleDialog(open);
          if (!open) {
            setSelectedUser(null);
            setSelectedRoleIds([]);
          }
        }}
      >
        <DialogContent data-testid="change-role-dialog">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Add or remove product roles for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Roles</Label>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3" data-testid="change-user-role-list">
              {getAvailableRoles(selectedUser?.organization_id).map((role) => {
                const checked = selectedRoleIds.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSelectedRole(role.id)}
                      data-testid={`change-user-role-checkbox-${role.id}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium leading-none">{role.name}</span>
                      {role.description && (
                        <span className="mt-1 block text-xs text-muted-foreground">{role.description}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={selectedRoleIds.length === 0} data-testid="confirm-change-role-btn">
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
