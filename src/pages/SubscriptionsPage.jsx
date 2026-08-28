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
import PaginationControls, { usePagination } from "../components/PaginationControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { subscriptionsApi } from "../lib/api";
import { toast } from "sonner";
import { CreditCard, Search, MoreVertical, Pause, Play, XCircle, Calendar, Package, Gauge, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSub, setSelectedSub] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [quotaValue, setQuotaValue] = useState("");
  const [usedQuotaValue, setUsedQuotaValue] = useState("");
  const [customPriceValue, setCustomPriceValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await subscriptionsApi.getAll(params);
      setSubscriptions(response.data);
    } catch (error) {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (sub) => {
    setActionLoading(true);
    try {
      await subscriptionsApi.pause(sub.id);
      toast.success("Subscription paused");
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to pause subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async (sub) => {
    setActionLoading(true);
    try {
      await subscriptionsApi.resume(sub.id);
      toast.success("Subscription resumed");
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to resume subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedSub) return;
    setActionLoading(true);
    try {
      await subscriptionsApi.cancel(selectedSub.id);
      toast.success("Subscription cancelled");
      fetchSubscriptions();
      setShowCancelDialog(false);
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const openQuotaDialog = (sub) => {
    setSelectedSub(sub);
    setQuotaValue(sub.quota ?? sub.api_count ?? "");
    setUsedQuotaValue(sub.used_quota ?? "");
    setCustomPriceValue(sub.amount ?? "");
    setShowQuotaDialog(true);
  };

  const handleQuotaSave = async () => {
    if (!selectedSub) return;
    setActionLoading(true);
    try {
      const quota = quotaValue === "" ? null : Number(quotaValue);
      const usedQuota = usedQuotaValue === "" ? null : Number(usedQuotaValue);
      const amount = customPriceValue === "" ? selectedSub.amount : Number(customPriceValue);
      await subscriptionsApi.updateBillingSettings(selectedSub.id, { quota, used_quota: usedQuota, amount });
      toast.success("Billing settings updated");
      setShowQuotaDialog(false);
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to update billing settings");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSubs = subscriptions.filter(
    (sub) =>
      sub.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const subscriptionsPagination = usePagination(filteredSubs);

  const getStatusBadge = (status) => {
    const classes = {
      active: "status-active",
      paused: "status-paused",
      cancelled: "status-cancelled",
      expired: "status-rejected",
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
    <div className="space-y-6 animate-fade-in" data-testid="subscriptions-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Manage all active and inactive subscriptions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
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
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50" data-testid="subscriptions-table">
        <CardContent className="p-0">
          {filteredSubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">No subscriptions found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Subscriptions will appear here when organizations are approved
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionsPagination.pageItems.map((sub) => (
                  <TableRow key={sub.id} data-testid={`sub-row-${sub.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="font-medium">{sub.organization_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.product_name || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sub.plan_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sub.tools.map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">${sub.billing_amount ?? sub.amount}</span>
                        <span className="text-muted-foreground text-xs">
                          {sub.plan_tier === "enterprise" && sub.is_per_user ? `${sub.billable_users || 0} users x $${sub.billing_unit_price ?? sub.amount}` : "subscription price"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => openQuotaDialog(sub)}>
                        <Gauge className="h-4 w-4" />
                        {sub.quota ?? sub.api_count ?? "Set"}
                      </Button>
                      {sub.remaining_quota !== undefined && sub.remaining_quota !== null && (
                        <p className="mt-1 text-xs text-muted-foreground">{sub.remaining_quota} remaining</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex flex-col">
                        <span>{format(new Date(sub.start_date), "MMM d, yyyy")}</span>
                        <span className="text-xs">to {format(new Date(sub.end_date), "MMM d, yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedSub(sub); setShowDetailDialog(true); }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openQuotaDialog(sub)}>
                            <Gauge className="mr-2 h-4 w-4" />
                            Edit Billing Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {sub.status === "active" && (
                            <DropdownMenuItem onClick={() => handlePause(sub)} disabled={actionLoading}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {sub.status === "paused" && (
                            <DropdownMenuItem onClick={() => handleResume(sub)} disabled={actionLoading}>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {sub.status !== "cancelled" && (
                            <DropdownMenuItem
                              onClick={() => { setSelectedSub(sub); setShowCancelDialog(true); }}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <PaginationControls {...subscriptionsPagination} onPageChange={subscriptionsPagination.setPage} />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg" data-testid="detail-dialog">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CreditCard className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedSub.organization_name}</h3>
                    <Badge variant="secondary">{selectedSub.plan_name} Plan</Badge>
                  </div>
                </div>
                {getStatusBadge(selectedSub.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Billing Amount</p>
                  <p className="font-bold text-xl">${selectedSub.billing_amount ?? selectedSub.amount}<span className="text-sm font-normal text-muted-foreground">/{selectedSub.billing_cycle === "monthly" ? "month" : "year"}</span></p>
                  {selectedSub.plan_tier === "enterprise" && (
                    <p className="text-xs text-muted-foreground">
                      {selectedSub.is_per_user ? `${selectedSub.billable_users || 0} users x $${selectedSub.billing_unit_price ?? selectedSub.amount}` : "Flat subscription price"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Billing Cycle</p>
                  <p className="font-medium capitalize">{selectedSub.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quota</p>
                  <p className="font-medium">{selectedSub.quota ?? selectedSub.api_count ?? "Not set"}</p>
                  <p className="text-xs text-muted-foreground">
                    Used {selectedSub.used_quota ?? 0}
                    {selectedSub.remaining_quota !== undefined && selectedSub.remaining_quota !== null ? `, ${selectedSub.remaining_quota} remaining` : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="text-sm">{format(new Date(selectedSub.start_date), "PPP")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="text-sm">{format(new Date(selectedSub.end_date), "PPP")}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Features Included</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSub.tools.map((tool) => (
                    <Badge key={tool} variant="outline">
                      <Package className="mr-1 h-3 w-3" />
                      {tool.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Billing Settings Dialog */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent data-testid="quota-dialog">
          <DialogHeader>
            <DialogTitle>Edit Billing Settings</DialogTitle>
            <DialogDescription>
              Set product quota, usage, and custom subscription price for {selectedSub?.organization_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quota</label>
              <Input
                type="number"
                min="0"
                placeholder="Leave blank for no explicit limit"
                value={quotaValue}
                onChange={(event) => setQuotaValue(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Used Quota</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={usedQuotaValue}
                onChange={(event) => setUsedQuotaValue(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Custom Subscription Price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={customPriceValue}
                  onChange={(event) => setCustomPriceValue(event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuotaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuotaSave} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent data-testid="cancel-dialog">
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the subscription for {selectedSub?.organization_name}? 
              This will immediately stop their access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading}
              data-testid="confirm-cancel-btn"
            >
              {actionLoading ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
