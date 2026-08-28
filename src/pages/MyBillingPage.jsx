import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { myOrganizationApi } from "../lib/api";
import { toast } from "sonner";
import { Receipt, DollarSign, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import PaginationControls, { usePagination } from "../components/PaginationControls";

export default function MyBillingPage() {
  const [billingRecords, setBillingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const billingPagination = usePagination(billingRecords);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      const response = await myOrganizationApi.getBilling();
      setBillingRecords(response.data);
    } catch (error) {
      toast.error("Failed to load billing records");
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = billingRecords
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  const totalPending = billingRecords
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6" data-testid="my-billing-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Billing</h1>
        <p className="text-muted-foreground mt-1">View your billing history and invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{billingRecords.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>All your invoices and payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : billingRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No billing records found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Billing Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingPagination.pageItems.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">
                        {record.invoice_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.billing_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.due_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${record.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            record.status === "paid"
                              ? "status-approved"
                              : record.status === "pending"
                              ? "status-pending"
                              : "status-rejected"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.paid_date
                          ? format(new Date(record.paid_date), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationControls {...billingPagination} onPageChange={billingPagination.setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
