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
import { Edit, Users, Search, Trash2, Plus } from "lucide-react";
import { getErrorMessage } from "../lib/utils";
import PaginationControls, { usePagination } from "../components/PaginationControls";

const productRoleCodes = [
  "ORG_ADMIN",
  "BUSINESS_UNIT_OWNER",
  "BUSINESS_UNIT_ADMIN",
  "PROJECT_ADMIN",
  "APPLICATION_OWNER",
  "APPLICATION_MEMBER",
  "API_AGENT_CONSUMER",
];

const scopeTypes = ["ORGANIZATION", "BUSINESS_UNIT", "PROJECT", "APPLICATION"];
const organizationScopeValue = "__organization__";

const emptyProductRoleForm = {
  roleCode: "PROJECT_ADMIN",
  scopeType: "PROJECT",
  scopeId: "",
  active: true,
};

export default function MyUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null, roleIds: [] });
  const [productRoleDialog, setProductRoleDialog] = useState({
    open: false,
    user: null,
    assignment: null,
    values: emptyProductRoleForm,
  });
  const [productRoleDeleteDialog, setProductRoleDeleteDialog] = useState({ open: false, assignment: null });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [
        usersResponse,
        rolesResponse,
        organizationResponse,
        businessUnitsResponse,
        projectsResponse,
        roleAssignmentsResponse,
      ] = await Promise.all([
        myOrganizationApi.getUsers(),
        myOrganizationApi.getRoles(),
        myOrganizationApi.getOrganization(),
        myOrganizationApi.getBusinessUnits(),
        myOrganizationApi.getProjects(),
        myOrganizationApi.getRoleAssignments(),
      ]);
      setUsers(usersResponse.data || []);
      setRoles(rolesResponse.data || []);
      setOrganization(organizationResponse.data || null);
      setBusinessUnits(businessUnitsResponse.data || []);
      setProjects(projectsResponse.data || []);
      setRoleAssignments(roleAssignmentsResponse.data || []);
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
  const usersPagination = usePagination(filteredUsers);

  const getAssignedRoleIds = (user) => {
    if (Array.isArray(user?.admin_role_ids) && user.admin_role_ids.length > 0) {
      return user.admin_role_ids;
    }
    if (Array.isArray(user?.role_ids) && user.role_ids.length > 0) {
      return user.role_ids;
    }
    return user?.role_id ? [user.role_id] : [];
  };

  const openProductRoleDialog = (user, assignment = null) => {
    setProductRoleDialog({
      open: true,
      user,
      assignment,
      values: assignment
        ? {
            roleCode: assignment.role_code || assignment.roleCode || "PROJECT_ADMIN",
            scopeType: assignment.scope_type || assignment.scopeType || "PROJECT",
            scopeId: assignment.scope_id || assignment.scopeId || "",
            active: assignment.active !== false,
          }
        : {
            ...emptyProductRoleForm,
            scopeId: projects[0]?.id || "",
          },
    });
  };

  const closeProductRoleDialog = () => {
    setProductRoleDialog({ open: false, user: null, assignment: null, values: emptyProductRoleForm });
  };

  const updateProductRoleValue = (field, value) => {
    setProductRoleDialog((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value,
        ...(field === "scopeType" ? { scopeId: getDefaultScopeId(value) } : {}),
      },
    }));
  };

  const getDefaultScopeId = (scopeType) => {
    if (scopeType === "ORGANIZATION") return organization?.id || organizationScopeValue;
    if (scopeType === "BUSINESS_UNIT") return businessUnits[0]?.id || "";
    if (scopeType === "PROJECT") return projects[0]?.id || "";
    return "";
  };

  const handleSaveProductRole = async () => {
    if (!productRoleDialog.user) return;
    const values = productRoleDialog.values;
    if (!values.roleCode || !values.scopeType || !values.scopeId) {
      toast.error("Role, scope type, and scope are required");
      return;
    }

    try {
      if (productRoleDialog.assignment) {
        await myOrganizationApi.updateRoleAssignment(productRoleDialog.assignment.id, {
          active: values.active,
          validFrom: null,
          validTo: null,
        });
        toast.success("Product role assignment updated");
      } else {
        await myOrganizationApi.createRoleAssignment({
          principalId: productRoleDialog.user.id,
          principalEmail: productRoleDialog.user.email,
          principalName: productRoleDialog.user.name,
          roleKind: "ACCESS",
          roleCode: values.roleCode,
          scopeType: values.scopeType,
          scopeId: values.scopeId === organizationScopeValue ? organization?.id : values.scopeId,
        });
        toast.success("Product role assignment created");
      }
      closeProductRoleDialog();
      fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save product role assignment"));
    }
  };

  const handleDeleteProductRole = async () => {
    if (!productRoleDeleteDialog.assignment) return;
    try {
      await myOrganizationApi.deleteRoleAssignment(productRoleDeleteDialog.assignment.id);
      toast.success("Product role assignment deleted");
      fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete product role assignment"));
    } finally {
      setProductRoleDeleteDialog({ open: false, assignment: null });
    }
  };

  const getAssignedRoleNames = (user) => {
    if (Array.isArray(user?.admin_role_names) && user.admin_role_names.length > 0) {
      return user.admin_role_names;
    }
    if (Array.isArray(user?.role_names) && user.role_names.length > 0) {
      return user.role_names;
    }
    return user?.role_name ? [user.role_name] : [];
  };

  const getProductRoleNames = (user) => {
    if (Array.isArray(user?.product_role_names) && user.product_role_names.length > 0) {
      return user.product_role_names;
    }
    return [];
  };

  const getDirectProductAssignments = (user) => {
    const userEmail = user?.email?.toLowerCase();
    const userId = String(user?.id || "").toLowerCase();
    return roleAssignments.filter((assignment) => {
      const principalEmail = (assignment.principal_email || assignment.principalEmail || "").toLowerCase();
      const principalId = String(assignment.principal_id || assignment.principalId || "").toLowerCase();
      return (userEmail && principalEmail === userEmail) || (userId && principalId === userId);
    });
  };

  const formatProductAssignment = (assignment) => {
    const roleCode = assignment.role_code || assignment.roleCode || "ROLE";
    const scopeType = assignment.scope_type || assignment.scopeType || "SCOPE";
    return `${roleCode} / ${scopeType}`;
  };

  const getScopeOptions = (scopeType) => {
    if (scopeType === "ORGANIZATION") {
      return organization?.id ? [{ id: organization.id, name: organization.name || "Organization" }] : [];
    }
    if (scopeType === "BUSINESS_UNIT") {
      return businessUnits.map((businessUnit) => ({
        id: businessUnit.id,
        name: businessUnit.display_name || businessUnit.name || businessUnit.id,
      }));
    }
    if (scopeType === "PROJECT") {
      return projects.map((project) => ({
        id: project.id,
        name: project.name || project.id,
      }));
    }
    return [];
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
                    <TableHead>Admin Panel Role</TableHead>
                    <TableHead>Product API Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersPagination.pageItems.map((user) => {
                    const directAssignments = getDirectProductAssignments(user);
                    return (
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
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1.5">
                              {getProductRoleNames(user).length > 0 ? (
                                getProductRoleNames(user).map((roleName) => (
                                  <Badge key={roleName} variant="outline" className="max-w-[220px]">
                                    <span className="truncate">{roleName}</span>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">Not assigned</span>
                              )}
                            </div>
                            {directAssignments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {directAssignments.map((assignment) => (
                                  <Badge key={assignment.id} variant="secondary" className="gap-1.5">
                                    <span>{formatProductAssignment(assignment)}</span>
                                    <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => openProductRoleDialog(user, assignment)}>
                                      <Edit className="h-3 w-3" />
                                      <span className="sr-only">Edit product role assignment</span>
                                    </button>
                                    <button type="button" className="text-destructive hover:text-destructive" onClick={() => setProductRoleDeleteDialog({ open: true, assignment })}>
                                      <Trash2 className="h-3 w-3" />
                                      <span className="sr-only">Delete product role assignment</span>
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
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
                            <span className="sr-only">Edit admin panel roles</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openProductRoleDialog(user)}>
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add product role</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, user })}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove user</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls {...usersPagination} onPageChange={usersPagination.setPage} />
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

      <Dialog open={productRoleDialog.open} onOpenChange={(open) => (open ? null : closeProductRoleDialog())}>
        <DialogContent data-testid="my-user-product-role-dialog">
          <DialogHeader>
            <DialogTitle>{productRoleDialog.assignment ? "Edit Product Role" : "Add Product Role"}</DialogTitle>
            <DialogDescription>
              {productRoleDialog.assignment ? "Update direct onboarding role assignment status." : `Create an onboarding role assignment for ${productRoleDialog.user?.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={productRoleDialog.values.roleCode}
                  onValueChange={(value) => updateProductRoleValue("roleCode", value)}
                  disabled={Boolean(productRoleDialog.assignment)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productRoleCodes.map((roleCode) => (
                      <SelectItem key={roleCode} value={roleCode}>{roleCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scope Type</Label>
                <Select
                  value={productRoleDialog.values.scopeType}
                  onValueChange={(value) => updateProductRoleValue("scopeType", value)}
                  disabled={Boolean(productRoleDialog.assignment)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeTypes.map((scopeType) => (
                      <SelectItem key={scopeType} value={scopeType}>{scopeType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              {getScopeOptions(productRoleDialog.values.scopeType).length > 0 ? (
                <Select
                  value={productRoleDialog.values.scopeId}
                  onValueChange={(value) => updateProductRoleValue("scopeId", value)}
                  disabled={Boolean(productRoleDialog.assignment)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {getScopeOptions(productRoleDialog.values.scopeType).map((option) => (
                      <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={productRoleDialog.values.scopeId}
                  onChange={(event) => updateProductRoleValue("scopeId", event.target.value)}
                  disabled={Boolean(productRoleDialog.assignment)}
                />
              )}
            </div>
            {productRoleDialog.assignment && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={productRoleDialog.values.active ? "active" : "inactive"} onValueChange={(value) => updateProductRoleValue("active", value === "active")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeProductRoleDialog}>Cancel</Button>
            <Button onClick={handleSaveProductRole}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={productRoleDeleteDialog.open} onOpenChange={(open) => setProductRoleDeleteDialog({ open, assignment: open ? productRoleDeleteDialog.assignment : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Role</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{formatProductAssignment(productRoleDeleteDialog.assignment || {})}</strong> from onboarding?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProductRole} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
