import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { billingApi } from "../lib/api";
import { toast } from "sonner";
import { Receipt, Search, Eye, CheckCircle, XCircle, Calendar, DollarSign, Building2, RefreshCw, Download, Mail, Plus, X } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export default function BillingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailRecord, setEmailRecord] = useState(null);
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [customEmail, setCustomEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [generatingBills, setGeneratingBills] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const fetchRecords = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await billingApi.getAll(params);
      setRecords(response.data);
    } catch (error) {
      toast.error("Failed to load billing records");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnnualBills = async () => {
    setGeneratingBills(true);
    try {
      const response = await billingApi.generateAnnual();
      const { bills_created, bills_updated, bills_skipped, total_organizations } = response.data;
      if (bills_created > 0 || bills_updated > 0) {
        toast.success(`Prepared ${bills_created + bills_updated} annual invoice(s)`);
      } else if (bills_skipped > 0) {
        toast.info(`No pending annual invoices needed updates for ${total_organizations} organization(s)`);
      } else {
        toast.info("No active subscriptions found");
      }
      fetchRecords();
    } catch (error) {
      toast.error("Failed to generate annual invoices");
    } finally {
      setGeneratingBills(false);
    }
  };

  const handleDownloadInvoice = async (record) => {
    setActionLoading(true);
    try {
      const response = await billingApi.downloadInvoice(record.id);
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${record.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to download invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const openEmailDialog = async (record) => {
    setEmailRecord(record);
    setShowEmailDialog(true);
    setRecipientOptions([]);
    setSelectedEmails([]);
    setCustomEmail("");
    try {
      const response = await billingApi.getInvoiceRecipients(record.id);
      const options = response.data || [];
      setRecipientOptions(options);
      const defaultEmail = options.find((option) => option.type === "organization")?.email;
      setSelectedEmails(defaultEmail ? [defaultEmail] : []);
    } catch (error) {
      toast.error("Failed to load invoice recipients");
    }
  };

  const toggleSelectedEmail = (email) => {
    setSelectedEmails((current) =>
      current.includes(email)
        ? current.filter((item) => item !== email)
        : [...current, email]
    );
  };

  const addCustomEmail = () => {
    const email = customEmail.trim();
    if (!email) return;
    if (!selectedEmails.includes(email)) {
      setSelectedEmails((current) => [...current, email]);
    }
    setCustomEmail("");
  };

  const removeSelectedEmail = (email) => {
    setSelectedEmails((current) => current.filter((item) => item !== email));
  };

  const handleSendInvoiceEmail = async () => {
    if (!emailRecord || selectedEmails.length === 0) return;
    setSendingInvoice(true);
    try {
      await billingApi.sendInvoiceEmail(emailRecord.id, selectedEmails);
      toast.success("Invoice email sent");
      setShowEmailDialog(false);
      setEmailRecord(null);
      setSelectedEmails([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send invoice email");
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleMarkPaid = async (record) => {
    setActionLoading(true);
    try {
      await billingApi.markPaid(record.id, "card");
      toast.success("Payment marked as received");
      fetchRecords();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Failed to update payment status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkUnpaid = async (record) => {
    setActionLoading(true);
    try {
      await billingApi.markUnpaid(record.id);
      toast.success("Payment marked as unpaid");
      fetchRecords();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Failed to update payment status");
    } finally {
      setActionLoading(false);
    }
  };

  const availableMonths = useMemo(() => {
    const months = new Set();
    records.forEach((record) => {
      const date = parseISO(record.billing_date);
      const monthKey = format(date, "yyyy-MM");
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = record.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesMonth = true;
      if (monthFilter !== "all") {
        const recordDate = parseISO(record.billing_date);
        const [year, month] = monthFilter.split("-").map(Number);
        const filterStart = startOfMonth(new Date(year, month - 1));
        const filterEnd = endOfMonth(new Date(year, month - 1));
        matchesMonth = isWithinInterval(recordDate, { start: filterStart, end: filterEnd });
      }
      return matchesSearch && matchesMonth;
    });
  }, [records, searchTerm, monthFilter]);

  const getStatusBadge = (status) => {
    const classes = { paid: "status-paid", pending: "status-pending", failed: "status-rejected", refunded: "status-paused" };
    return <Badge variant="outline" className={classes[status] || ""}>{status}</Badge>;
  };

  const totalRevenue = filteredRecords.filter(r => r.status === "paid").reduce((sum, r) => sum + r.amount, 0);
  const pendingAmount = filteredRecords.filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="billing-page">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">View billing history and manage invoices</p>
        </div>
        <Button onClick={handleGenerateAnnualBills} disabled={generatingBills} className="w-full sm:w-auto">
          <RefreshCw className={`mr-2 h-4 w-4 ${generatingBills ? 'animate-spin' : ''}`} />
          {generatingBills ? "Generating..." : "Generate Annual Invoices"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10"><DollarSign className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">${pendingAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10"><Calendar className="h-5 w-5 text-amber-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{filteredRecords.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10"><Receipt className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {availableMonths.map((monthKey) => {
              const [year, month] = monthKey.split("-").map(Number);
              return <SelectItem key={monthKey} value={monthKey}>{format(new Date(year, month - 1), "MMMM yyyy")}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No invoices found</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Billing Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.invoice_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {record.organization_name}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">${record.amount.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(record.billing_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(record.due_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedRecord(record); setShowDetailDialog(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleDownloadInvoice(record)} disabled={actionLoading} title="Download Invoice">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => openEmailDialog(record)} disabled={actionLoading} title="Email Invoice">
                          <Mail className="h-4 w-4" />
                        </Button>
                        {record.status === "pending" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => handleMarkPaid(record)} disabled={actionLoading} title="Mark as Paid">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {record.status === "paid" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500" onClick={() => handleMarkUnpaid(record)} disabled={actionLoading} title="Mark as Unpaid">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>{selectedRecord?.invoice_number}</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Organization</p><p className="font-medium">{selectedRecord.organization_name}</p></div>
                <div><p className="text-sm text-muted-foreground">Amount</p><p className="font-medium">${selectedRecord.amount}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p>{getStatusBadge(selectedRecord.status)}</div>
                <div><p className="text-sm text-muted-foreground">Payment Method</p><p className="font-medium">{selectedRecord.payment_method || "N/A"}</p></div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedRecord && (
              <Button onClick={() => handleDownloadInvoice(selectedRecord)} disabled={actionLoading} variant="outline">
                <Download className="mr-2 h-4 w-4" />Download Invoice
              </Button>
            )}
            {selectedRecord && (
              <Button onClick={() => openEmailDialog(selectedRecord)} disabled={actionLoading} variant="outline">
                <Mail className="mr-2 h-4 w-4" />Email Invoice
              </Button>
            )}
            {selectedRecord?.status === "pending" && (
              <Button onClick={() => handleMarkPaid(selectedRecord)} disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle className="mr-2 h-4 w-4" />Mark as Paid
              </Button>
            )}
            {selectedRecord?.status === "paid" && (
              <Button onClick={() => handleMarkUnpaid(selectedRecord)} disabled={actionLoading} variant="outline" className="text-amber-600">
                <XCircle className="mr-2 h-4 w-4" />Mark as Unpaid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Invoice</DialogTitle>
            <DialogDescription>{emailRecord?.invoice_number}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {recipientOptions.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">No saved recipients found for this organization.</p>
                ) : (
                  recipientOptions.map((option) => (
                    <label key={option.email} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted">
                      <Checkbox
                        checked={selectedEmails.includes(option.email)}
                        onCheckedChange={() => toggleSelectedEmail(option.email)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-none">{option.name || option.email}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{option.email} · {option.type.replace("_", " ")}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Add Email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="finance@example.com"
                  value={customEmail}
                  onChange={(event) => setCustomEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomEmail();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addCustomEmail}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
            {selectedEmails.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button type="button" onClick={() => removeSelectedEmail(email)} className="ml-1 rounded-full hover:text-destructive">
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove recipient</span>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">ProbeStack notification group will be included in BCC.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvoiceEmail} disabled={sendingInvoice || selectedEmails.length === 0}>
              <Mail className="mr-2 h-4 w-4" />
              {sendingInvoice ? "Sending..." : "Send Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
