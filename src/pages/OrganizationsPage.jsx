import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import { organizationsApi } from "../lib/api";
import { toast } from "sonner";
import { Building2, Search, MoreVertical, Trash2, Eye, Mail, Phone, Globe, Edit, Hash, AtSign } from "lucide-react";
import { format } from "date-fns";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    external_org_id: "",
    auth0_org_id: "",
    supported_domains: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter]);

  const fetchOrganizations = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await organizationsApi.getAll(params);
      setOrganizations(response.data);
    } catch (error) {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    try {
      await organizationsApi.delete(selectedOrg.id);
      toast.success(`${selectedOrg.name} has been deleted`);
      fetchOrganizations();
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error("Failed to delete organization");
    }
  };

  const openEditDialog = (org) => {
    setSelectedOrg(org);
    setEditData({
      external_org_id: org.external_org_id || "",
      auth0_org_id: org.auth0_org_id || "",
      supported_domains: org.supported_domains ? org.supported_domains.join(", ") : "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrg) return;
    setSaving(true);
    try {
      // Parse supported domains from comma-separated string
      const domainsArray = editData.supported_domains
        .split(",")
        .map(d => d.trim())
        .filter(d => d.length > 0)
        .map(d => d.startsWith("@") ? d : `@${d}`);  // Ensure @ prefix

      await organizationsApi.update(selectedOrg.id, {
        external_org_id: editData.external_org_id || null,
        auth0_org_id: editData.auth0_org_id || null,
        supported_domains: domainsArray.length > 0 ? domainsArray : null,
      });
      toast.success("Organization updated successfully");
      fetchOrganizations();
      setShowEditDialog(false);
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to update organization";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const classes = {
      pending: "status-pending",
      approved: "status-approved",
      rejected: "status-rejected",
    };
    return (
      <Badge variant="outline" className={classes[status] || ""}>
        {status}
      </Badge>
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
    <div className="space-y-6 animate-fade-in" data-testid="organizations-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">All Organizations</h1>
        <p className="text-muted-foreground mt-1">Manage all registered organizations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50" data-testid="organizations-table">
        <CardContent className="p-0">
          {filteredOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No organizations found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.map((org) => (
                  <TableRow key={org.id} data-testid={`org-row-${org.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.domain || "No domain"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.external_org_id ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {org.external_org_id}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{org.contact_person}</p>
                        <p className="text-xs text-muted-foreground">{org.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{org.requested_plan}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(org.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedOrg(org); setShowDetailDialog(true); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(org)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Integration
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setSelectedOrg(org); setShowDeleteDialog(true); }}
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg" data-testid="detail-dialog">
          <DialogHeader>
            <DialogTitle>Organization Details</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">{selectedOrg.name}</h3>
                  {getStatusBadge(selectedOrg.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedOrg.email}</span>
                </div>
                {selectedOrg.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrg.phone}</span>
                  </div>
                )}
                {selectedOrg.domain && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedOrg.domain}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact Person</p>
                  <p className="font-medium">{selectedOrg.contact_person}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Plan</p>
                  <Badge variant="secondary">{selectedOrg.requested_plan}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm">{format(new Date(selectedOrg.created_at), "PPP")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tools</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedOrg.requested_tools.map((tool) => (
                      <Badge key={tool} variant="outline" className="text-xs">
                        {tool.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {selectedOrg.rejection_reason && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm text-destructive">{selectedOrg.rejection_reason}</p>
                </div>
              )}

              {/* Integration Settings */}
              {selectedOrg.status === "approved" && (
                <div className="pt-4 border-t space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Integration Settings</p>
                  <div className="flex items-center gap-3 text-sm">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">External Org ID:</span>
                    {selectedOrg.external_org_id ? (
                      <Badge variant="outline" className="font-mono">{selectedOrg.external_org_id}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Auth0 Org ID:</span>
                    {selectedOrg.auth0_org_id ? (
                      <Badge variant="outline" className="font-mono">{selectedOrg.auth0_org_id}</Badge>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <AtSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">Supported Domains:</span>
                      {selectedOrg.supported_domains && selectedOrg.supported_domains.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedOrg.supported_domains.map((domain) => (
                            <Badge key={domain} variant="secondary" className="font-mono text-xs">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic ml-1">Not configured</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent data-testid="delete-dialog">
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOrg?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Integration Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent data-testid="edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit Integration Settings</DialogTitle>
            <DialogDescription>
              Configure external app integration for {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="external_org_id">External Organization ID</Label>
              <Input
                id="external_org_id"
                placeholder="e.g., KRE, TECHCORP, ORG123"
                value={editData.external_org_id}
                onChange={(e) => setEditData({ ...editData, external_org_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used by external apps to reference this organization
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth0_org_id">Auth0 Organization ID</Label>
              <Input
                id="auth0_org_id"
                placeholder="e.g., org_SVFows90OrYpzdIs"
                value={editData.auth0_org_id}
                onChange={(e) => setEditData({ ...editData, auth0_org_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Auth0 organization ID (starts with org_). Get this from your Auth0 dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supported_domains">Supported Email Domains</Label>
              <Textarea
                id="supported_domains"
                placeholder="@kre.com, @probestack.io"
                value={editData.supported_domains}
                onChange={(e) => setEditData({ ...editData, supported_domains: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of email domains that belong to this organization (e.g., @kre.com, @probestack.io)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
