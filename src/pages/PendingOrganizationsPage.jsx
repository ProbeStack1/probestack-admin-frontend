import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { organizationsApi } from "../lib/api";
import { toast } from "sonner";
import { Building2, Clock, Search, Eye, Check, X, Package } from "lucide-react";
import { cn, getErrorMessage } from "../lib/utils";
import { format } from "date-fns";

export default function PendingOrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationsApi.getPending();
      setOrganizations(response.data);
    } catch (error) {
      toast.error("Failed to load pending organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (org) => {
    setActionLoading(true);
    try {
      await organizationsApi.approve(org.id);
      toast.success(`${org.name} has been approved`);
      fetchOrganizations();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve organization"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrg) return;
    setActionLoading(true);
    try {
      await organizationsApi.reject(selectedOrg.id, rejectReason);
      toast.success(`${selectedOrg.name} has been rejected`);
      fetchOrganizations();
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      setRejectReason("");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reject organization"));
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (org) => {
    setSelectedOrg(org);
    setShowRejectDialog(true);
  };

  const openDetailDialog = (org) => {
    setSelectedOrg(org);
    setShowDetailDialog(true);
  };

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="pending-organizations-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pending Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve new organization requests
          </p>
        </div>
        <Badge variant="outline" className="w-fit status-pending">
          <Clock className="mr-1 h-3 w-3" />
          {organizations.length} Pending
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          data-testid="search-input"
        />
      </div>

      {/* Table */}
      <Card className="border-border/50" data-testid="organizations-table">
        <CardContent className="p-0">
          {filteredOrgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No pending requests</h3>
              <p className="text-muted-foreground text-sm mt-1">
                All organization requests have been processed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Requested Plan</TableHead>
                  <TableHead>Tools</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <div>
                        <p className="text-sm">{org.contact_person}</p>
                        <p className="text-xs text-muted-foreground">{org.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{org.requested_plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {org.requested_tools.map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(org.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailDialog(org)}
                          data-testid={`view-btn-${org.id}`}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleApprove(org)}
                          disabled={actionLoading}
                          data-testid={`approve-btn-${org.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(org)}
                          disabled={actionLoading}
                          data-testid={`reject-btn-${org.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
            <DialogDescription>Review the organization request details</DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedOrg.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedOrg.domain || "No domain"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact Person</p>
                  <p className="font-medium">{selectedOrg.contact_person}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                  <p className="font-medium">{selectedOrg.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="font-medium">{selectedOrg.phone || "Not provided"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Requested Plan</p>
                  <Badge variant="secondary">{selectedOrg.requested_plan}</Badge>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Requested Tools</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOrg.requested_tools.map((tool) => (
                    <Badge key={tool} variant="outline">
                      <Package className="mr-1 h-3 w-3" />
                      {tool.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedOrg.address && (
                <div className="space-y-1 pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                  <p className="text-sm">{selectedOrg.address}</p>
                </div>
              )}

              {selectedOrg.description && (
                <div className="space-y-1 pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Description / Notes</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedOrg.description}</p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Gateway Onboarding</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Region</p>
                    <p className="font-medium">{selectedOrg.gateway_region || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Gateway Org Name</p>
                    <p className="font-medium">{selectedOrg.gateway_organization_name || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Environment Type</p>
                    <p className="font-medium">{selectedOrg.gateway_environment_type || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Environments</p>
                    <p className="font-medium">{(selectedOrg.gateway_environments || []).join(", ") || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => openRejectDialog(selectedOrg)}
              disabled={actionLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleApprove(selectedOrg)}
              disabled={actionLoading}
              data-testid="dialog-approve-btn"
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="reject-dialog">
          <DialogHeader>
            <DialogTitle>Reject Organization</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason (Optional)</Label>
              <Textarea
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                data-testid="reject-reason-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
              data-testid="confirm-reject-btn"
            >
              {actionLoading ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
