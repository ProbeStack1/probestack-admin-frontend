import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
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
import { upgradeRequestsApi } from "../lib/api";
import { toast } from "sonner";
import { TrendingUp, Check, X, Clock, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function UpgradeRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approveDialog, setApproveDialog] = useState({ open: false, request: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, request: null });
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await upgradeRequestsApi.getAll();
      setRequests(response.data);
    } catch (error) {
      toast.error("Failed to load upgrade requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveDialog.request) return;
    setProcessing(true);
    try {
      await upgradeRequestsApi.approve(approveDialog.request.id);
      toast.success("Upgrade request approved successfully");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to approve request");
    } finally {
      setProcessing(false);
      setApproveDialog({ open: false, request: null });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.request) return;
    setProcessing(true);
    try {
      await upgradeRequestsApi.reject(rejectDialog.request.id, rejectReason);
      toast.success("Upgrade request rejected");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject request");
    } finally {
      setProcessing(false);
      setRejectDialog({ open: false, request: null });
      setRejectReason("");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6" data-testid="upgrade-requests-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Plan Upgrade Requests</h1>
        <p className="text-muted-foreground mt-1">Review and manage subscription upgrade requests</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
          <CardDescription>Upgrade requests awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending upgrade requests</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Current Plan</TableHead>
                    <TableHead>Requested Plan</TableHead>
                    <TableHead>Tools</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.organization_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{request.current_plan_name}</TableCell>
                      <TableCell><span className="font-medium text-primary">{request.requested_plan_name}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(request.requested_tools || []).map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-xs">{tool.replace(/_/g, " ")}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="text-green-600" onClick={() => setApproveDialog({ open: true, request })}>
                            <Check className="h-4 w-4 mr-1" />Approve
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setRejectDialog({ open: true, request })}>
                            <X className="h-4 w-4 mr-1" />Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {processedRequests.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Processed Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>From Plan</TableHead>
                    <TableHead>To Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.organization_name}</TableCell>
                      <TableCell>{request.current_plan_name}</TableCell>
                      <TableCell>{request.requested_plan_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={request.status === "approved" ? "status-approved" : "status-rejected"}>{request.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.approved_at || request.rejected_at ? format(new Date(request.approved_at || request.rejected_at), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, request: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Upgrade Request</DialogTitle>
            <DialogDescription>Approve the plan upgrade for <strong>{approveDialog.request?.organization_name}</strong>?</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Current Plan:</span>
              <span className="font-medium">{approveDialog.request?.current_plan_name}</span>
            </div>
            <div className="flex justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-muted-foreground">New Plan:</span>
              <span className="font-medium text-primary">{approveDialog.request?.requested_plan_name}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog({ open: false, request: null })} disabled={processing}>Cancel</Button>
            <Button onClick={handleApprove} disabled={processing}>{processing ? "Processing..." : "Approve Upgrade"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, request: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Upgrade Request</DialogTitle>
            <DialogDescription>Reject the plan upgrade request from <strong>{rejectDialog.request?.organization_name}</strong>?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Rejection (Optional)</Label>
              <Textarea placeholder="Provide a reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, request: null })} disabled={processing}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>{processing ? "Processing..." : "Reject Request"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
