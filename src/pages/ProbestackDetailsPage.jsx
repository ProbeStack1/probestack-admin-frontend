import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { probestackApi } from "../lib/api";
import { getErrorMessage } from "../lib/utils";
import { toast } from "sonner";
import { Building2, Loader2, Receipt, Save } from "lucide-react";

const emptyForm = {
  company_name: "",
  address_line_1: "",
  address_line_2: "",
  city_state_zip: "",
  country: "",
  billing_email: "",
  phone: "",
  tax_id: "",
  payment_terms: "",
  payment_instructions: "",
  footer_note: "",
};

export default function ProbestackDetailsPage() {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBillingDetails = async () => {
      setLoading(true);
      try {
        const response = await probestackApi.getBillingDetails();
        setFormData({ ...emptyForm, ...(response.data || {}) });
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load ProbeStack details"));
      } finally {
        setLoading(false);
      }
    };

    loadBillingDetails();
  }, []);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!formData.billing_email.trim()) {
      toast.error("Billing email is required");
      return;
    }
    if (!formData.payment_terms.trim()) {
      toast.error("Payment terms are required");
      return;
    }

    setSaving(true);
    try {
      const response = await probestackApi.updateBillingDetails(formData);
      setFormData({ ...emptyForm, ...(response.data.details || {}) });
      toast.success("ProbeStack billing details updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save ProbeStack details"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="probestack-details-page">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ProbeStack Details</h1>
        <p className="text-muted-foreground mt-1">Manage sender and payment details used on invoices</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Billing Identity
            </CardTitle>
            <CardDescription>Company information shown in the invoice From section</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Company Name" required>
                <Input value={formData.company_name} onChange={(event) => updateField("company_name", event.target.value)} />
              </FormField>
              <FormField label="Billing Email" required>
                <Input type="email" value={formData.billing_email} onChange={(event) => updateField("billing_email", event.target.value)} />
              </FormField>
              <FormField label="Address Line 1">
                <Input value={formData.address_line_1} onChange={(event) => updateField("address_line_1", event.target.value)} />
              </FormField>
              <FormField label="Address Line 2">
                <Input value={formData.address_line_2} onChange={(event) => updateField("address_line_2", event.target.value)} />
              </FormField>
              <FormField label="City, State, ZIP">
                <Input value={formData.city_state_zip} onChange={(event) => updateField("city_state_zip", event.target.value)} />
              </FormField>
              <FormField label="Country">
                <Input value={formData.country} onChange={(event) => updateField("country", event.target.value)} />
              </FormField>
              <FormField label="Phone">
                <Input value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} />
              </FormField>
              <FormField label="Tax ID">
                <Input value={formData.tax_id} onChange={(event) => updateField("tax_id", event.target.value)} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Invoice Preview
            </CardTitle>
            <CardDescription>Current invoice sender block</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-muted/20 p-4 text-sm">
              <p className="font-semibold">{formData.company_name}</p>
              {[formData.address_line_1, formData.address_line_2, formData.city_state_zip, formData.country].filter(Boolean).map((line) => (
                <p key={line} className="text-muted-foreground">{line}</p>
              ))}
              <div className="mt-3 space-y-1">
                {formData.billing_email && <p>{formData.billing_email}</p>}
                {formData.phone && <p>{formData.phone}</p>}
                {formData.tax_id && <p>Tax ID: {formData.tax_id}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
            <CardDescription>Terms and instructions printed near invoice totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField label="Payment Terms" required>
              <Input value={formData.payment_terms} onChange={(event) => updateField("payment_terms", event.target.value)} />
            </FormField>
            <FormField label="Payment Instructions">
              <Textarea
                value={formData.payment_instructions}
                onChange={(event) => updateField("payment_instructions", event.target.value)}
                rows={4}
              />
            </FormField>
            <FormField label="Footer Note">
              <Textarea
                value={formData.footer_note}
                onChange={(event) => updateField("footer_note", event.target.value)}
                rows={3}
              />
            </FormField>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Details"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
