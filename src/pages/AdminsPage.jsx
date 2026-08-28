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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { adminsApi, organizationsApi, api } from "../lib/api";
import { toast } from "sonner";
import { UserCog, Plus, Search, Trash2, ToggleLeft, ToggleRight, Building2, MoreVertical, Key, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "../lib/utils";
import PaginationControls, { usePagination } from "../components/PaginationControls";

export default function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, admin: null });
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, admin: null });
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    name: "",
    organization_id: "",
    role: "org_admin",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminsRes = await adminsApi.getAll();
      setAdmins(Array.isArray(adminsRes.data) ? adminsRes.data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load admin accounts"));
      setAdmins([]);
    }

    try {
      const orgsRes = await organizationsApi.getAll({ status: "approved" });
      setOrganizations(Array.isArray(orgsRes.data) ? orgsRes.data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load approved organizations"));
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.organization_id) {
      toast.error("Please select an organization");
      return;
    }
    
    setProcessing(true);
    try {
      await adminsApi.create(newAdmin);
      toast.success("Org Admin account created successfully");
      setCreateDialog(false);
      setNewAdmin({ email: "", password: "", name: "", organization_id: "", role: "org_admin" });
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Failed to create admin';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      await adminsApi.toggleStatus(admin.id);
      toast.success(`Admin ${admin.is_active ? "deactivated" : "activated"}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update admin status");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.admin) return;
    
    setProcessing(true);
    try {
      await adminsApi.delete(deleteDialog.admin.id);
      toast.success("Admin deleted successfully");
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Failed to delete admin';
      toast.error(message);
    } finally {
      setProcessing(false);
      setDeleteDialog({ open: false, admin: null });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordDialog.admin || !newPasswordInput) return;
    
    setProcessing(true);
    try {
      await api.post(`/admins/${resetPasswordDialog.admin.id}/reset-password`, {
        new_password: newPasswordInput,
      });
      toast.success(`Password reset successfully for ${resetPasswordDialog.admin.email}`);
      setResetPasswordDialog({ open: false, admin: null });
      setNewPasswordInput("");
      setShowNewPassword(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reset password"));
    } finally {
      setProcessing(false);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase()) ||
      (admin.organization_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const superAdmins = filteredAdmins.filter((a) => a.role === "super_admin");
  const orgAdmins = filteredAdmins.filter((a) => a.role === "org_admin");
  const superAdminsPagination = usePagination(superAdmins);
  const orgAdminsPagination = usePagination(orgAdmins);

  return (
    <div className="space-y-6" data-testid="admins-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage Super Admins and Organization Admins</p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Org Admin
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search admins..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Super Admins */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-red-500" />
            Super Admins ({superAdmins.length})
          </CardTitle>
          <CardDescription>Full access to all platform features</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : superAdmins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No super admins found</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {superAdminsPagination.pageItems.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={admin.is_active ? "status-active" : "status-inactive"}>
                          {admin.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(admin.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls {...superAdminsPagination} onPageChange={superAdminsPagination.setPage} />
        </CardContent>
      </Card>

      {/* Org Admins */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Organization Admins ({orgAdmins.length})
          </CardTitle>
          <CardDescription>Access limited to their organization's data</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orgAdmins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No organization admins found. Create one when you approve an organization.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgAdminsPagination.pageItems.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {admin.organization_name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={admin.is_active ? "status-active" : "status-inactive"}>
                          {admin.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(admin.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                              {admin.is_active ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4 text-amber-500" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4 text-green-500" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setResetPasswordDialog({ open: true, admin });
                              setNewPasswordInput("");
                            }}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ open: true, admin })}
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
            </div>
          )}
          <PaginationControls {...orgAdminsPagination} onPageChange={orgAdminsPagination.setPage} />
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization Admin</DialogTitle>
            <DialogDescription>
              Create a new admin account for an approved organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select
                value={newAdmin.organization_id}
                onValueChange={(value) => setNewAdmin({ ...newAdmin, organization_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
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
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="admin@organization.com"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, admin: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteDialog.admin?.name}</strong>'s account?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => {
        setResetPasswordDialog({ open, admin: open ? resetPasswordDialog.admin : null });
        if (!open) {
          setNewPasswordInput("");
          setShowNewPassword(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetPasswordDialog.admin?.name}</strong> ({resetPasswordDialog.admin?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The user will need to use this password to log in.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialog({ open: false, admin: null })}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={processing || !newPasswordInput}>
              {processing ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
