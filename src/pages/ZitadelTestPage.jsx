import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  History,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  RotateCcw,
  Shield,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const initialOrgForm = {
  name: "",
  email: "",
  domain: "",
  plan_ids: "",
  selected_tools: "",
  contact_person: "",
  contact_phone: "",
  company_address: "",
  description: "",
};

const initialUserForm = {
  email: "",
  name: "",
  organization_id: "",
  requested_role: "API/Agent Consumer",
  role_id: "",
};

function compactToken(token) {
  if (!token) return "";
  if (token.length <= 72) return token;
  return `${token.slice(0, 36)}...${token.slice(-18)}`;
}

function parseCsv(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function StatusLine({ response }) {
  if (!response) return null;
  const success = response.success !== false && !response.error;
  return (
    <div className="flex items-center gap-2 text-sm">
      {success ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="font-medium">{success ? "Success" : "Error"}</span>
      {response.status && <Badge variant="outline">{response.status}</Badge>}
    </div>
  );
}

function JsonBlock({ data }) {
  if (!data) return null;
  return (
    <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function optionId(id) {
  if (!id) return "";
  if (id.length <= 18) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

export default function ZitadelTestPage() {
  const [config, setConfig] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [records, setRecords] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState({});

  const [orgForm, setOrgForm] = useState(initialOrgForm);
  const [orgRequest, setOrgRequest] = useState(null);
  const [approveOrgId, setApproveOrgId] = useState("");
  const [approveOrgResponse, setApproveOrgResponse] = useState(null);

  const [userForm, setUserForm] = useState(initialUserForm);
  const [userRequest, setUserRequest] = useState(null);
  const [approveUserRequestId, setApproveUserRequestId] = useState("");
  const [approveUserResponse, setApproveUserResponse] = useState(null);
  const [roles, setRoles] = useState([]);

  const [loginForm, setLoginForm] = useState({
    email: "",
    product: "local",
    redirect_uri: "",
    state: "",
    code: "",
    refresh_token: "",
    id_token_hint: "",
  });
  const [initResponse, setInitResponse] = useState(null);
  const [callbackResponse, setCallbackResponse] = useState(null);
  const [refreshResponse, setRefreshResponse] = useState(null);
  const [logoutResponse, setLogoutResponse] = useState(null);

  useEffect(() => {
    fetchConfig();
    fetchOrganizations();
    fetchPricing();
    fetchRecords();
  }, []);

  const setBusy = (key, value) => setLoading((current) => ({ ...current, [key]: value }));

  const copyToClipboard = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text || "";
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      toast.success("Copied");
    } catch (error) {
      toast.error("Copy failed");
    }
  };

  const handleApiError = (error, fallback) => {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (detail) return JSON.stringify(detail);
    return fallback;
  };

  const resolveLoginSelection = () => {
    const redirectUri = loginForm.redirect_uri.trim();
    if (!redirectUri) {
      return { product: loginForm.product, redirect_uri: undefined };
    }
    const matchedRedirect = Object.entries(config?.redirect_uris || {}).find(
      ([, registeredUri]) => registeredUri === redirectUri
    );
    return {
      product: matchedRedirect?.[0] || loginForm.product,
      redirect_uri: redirectUri,
    };
  };

  const fetchConfig = async () => {
    setBusy("config", true);
    try {
      const response = await api.get("/public/zitadel-config");
      setConfig(response.data);
    } catch (error) {
      toast.error(handleApiError(error, "Failed to load Zitadel config"));
    } finally {
      setBusy("config", false);
    }
  };

  const fetchPricing = async () => {
    setBusy("pricing", true);
    try {
      const response = await api.get("/public/pricing");
      setPricing(response.data?.products || response.data || []);
    } catch (error) {
      toast.error(handleApiError(error, "Failed to load public pricing"));
    } finally {
      setBusy("pricing", false);
    }
  };

  const fetchOrganizations = async () => {
    setBusy("organizations", true);
    try {
      const response = await api.get("/organizations");
      const approvedOrgs = (response.data || []).filter((org) => org.status === "approved");
      setOrganizations(approvedOrgs);
    } catch (error) {
      toast.error(handleApiError(error, "Failed to load organizations"));
    } finally {
      setBusy("organizations", false);
    }
  };

  const fetchRecords = async () => {
    setBusy("records", true);
    try {
      const response = await api.get("/zitadel-logins");
      setRecords(response.data || []);
    } catch (error) {
      setRecords([]);
    } finally {
      setBusy("records", false);
    }
  };

  const submitOrgRequest = async () => {
    if (!orgForm.name || !orgForm.email || !orgForm.contact_person) {
      toast.error("Name, email, domain, contact person, contact phone, company address, and description are required");
      return;
    }
    const planIds = parseCsv(orgForm.plan_ids);
    if (!orgForm.domain || !orgForm.contact_phone || !orgForm.company_address || !orgForm.description) {
      toast.error("Name, email, domain, contact person, contact phone, company address, and description are required");
      return;
    }
    setBusy("orgRequest", true);
    try {
      const response = await api.post("/public/organizations/request", {
        name: orgForm.name,
        email: orgForm.email,
        domain: orgForm.domain,
        plan_ids: planIds,
        selected_tools: parseCsv(orgForm.selected_tools),
        contact_person: orgForm.contact_person,
        contact_phone: orgForm.contact_phone,
        company_address: orgForm.company_address,
        description: orgForm.description,
        identity_provider: "zitadel",
        skip_auth0: true,
      });
      setOrgRequest(response.data);
      setApproveOrgId(response.data.request_id || "");
      setUserForm((current) => ({ ...current, organization_id: response.data.request_id || current.organization_id }));
      toast.success("Organization request created");
    } catch (error) {
      const message = handleApiError(error, "Failed to create organization request");
      setOrgRequest({ error: message });
      toast.error(message);
    } finally {
      setBusy("orgRequest", false);
    }
  };

  const approveOrganization = async () => {
    if (!approveOrgId) {
      toast.error("Organization request ID is required");
      return;
    }
    setBusy("approveOrg", true);
    try {
      const response = await api.post(`/organizations/${approveOrgId}/approve`);
      setApproveOrgResponse(response.data);
      toast.success("Organization approved and provisioned");
    } catch (error) {
      const message = handleApiError(error, "Failed to approve organization");
      setApproveOrgResponse({ error: message });
      toast.error(message);
    } finally {
      setBusy("approveOrg", false);
    }
  };

  const fetchOrgRoles = async (organizationId = userForm.organization_id) => {
    if (!organizationId) {
      toast.error("Organization ID is required");
      return;
    }
    setBusy("orgLookups", true);
    try {
      const rolesResponse = await api.get(`/public/organizations/${organizationId}/roles`);
      const nextRoles = rolesResponse.data?.roles || rolesResponse.data || [];
      setRoles(nextRoles);
      if (nextRoles[0]?.id && !userForm.role_id) {
        setUserForm((current) => ({ ...current, role_id: nextRoles[0].id, requested_role: nextRoles[0].name || current.requested_role }));
      }
      toast.success("Organization roles loaded");
    } catch (error) {
      toast.error(handleApiError(error, "Failed to load organization roles"));
    } finally {
      setBusy("orgLookups", false);
    }
  };

  const handleOrganizationSelect = (organizationId) => {
    setUserForm((current) => ({ ...current, organization_id: organizationId, role_id: "" }));
    setRoles([]);
    fetchOrgRoles(organizationId);
  };

  const handleRoleSelect = (roleId) => {
    const selectedRole = roles.find((role) => role.id === roleId);
    setUserForm((current) => ({
      ...current,
      role_id: roleId,
      requested_role: selectedRole?.name || current.requested_role,
    }));
  };

  const submitUserRequest = async () => {
    if (!userForm.email || !userForm.name || !userForm.organization_id) {
      toast.error("User email, name, and organization ID are required");
      return;
    }
    setBusy("userRequest", true);
    try {
      const response = await api.post("/public/users/request", {
        email: userForm.email,
        name: userForm.name,
        organization_id: userForm.organization_id,
        requested_role: userForm.requested_role,
        identity_provider: "zitadel",
        skip_auth0: true,
      });
      setUserRequest(response.data);
      setApproveUserRequestId(response.data.request_id || "");
      setLoginForm((current) => ({ ...current, email: userForm.email }));
      toast.success("User request created");
    } catch (error) {
      const message = handleApiError(error, "Failed to create user request");
      setUserRequest({ error: message });
      toast.error(message);
    } finally {
      setBusy("userRequest", false);
    }
  };

  const approveUser = async () => {
    if (!approveUserRequestId || !userForm.role_id) {
      toast.error("Request ID and role ID are required");
      return;
    }
    setBusy("approveUser", true);
    try {
      const response = await api.post(`/user-requests/${approveUserRequestId}/approve`, null, {
        params: {
          role_id: userForm.role_id,
          identity_provider: "zitadel",
          skip_auth0: true,
        },
      });
      setApproveUserResponse(response.data);
      toast.success("User approved and provisioned");
    } catch (error) {
      const message = handleApiError(error, "Failed to approve user");
      setApproveUserResponse({ error: message });
      toast.error(message);
    } finally {
      setBusy("approveUser", false);
    }
  };

  const initLogin = async () => {
    if (!loginForm.email) {
      toast.error("Login email is required");
      return;
    }
    setBusy("initLogin", true);
    try {
      const loginSelection = resolveLoginSelection();
      const response = await api.post("/public/zitadel/auth/init", {
        email: loginForm.email,
        product: loginSelection.product,
        redirect_uri: loginSelection.redirect_uri,
        state: loginForm.state || undefined,
      });
      setInitResponse(response.data);
      setLoginForm((current) => ({ ...current, product: response.data.product || loginSelection.product }));
      toast.success("Zitadel login URL created");
    } catch (error) {
      const message = handleApiError(error, "Failed to initialize Zitadel login");
      setInitResponse({ error: message });
      toast.error(message);
    } finally {
      setBusy("initLogin", false);
    }
  };

  const exchangeCode = async () => {
    if (!loginForm.code) {
      toast.error("Authorization code is required");
      return;
    }
    setBusy("callback", true);
    try {
      const loginSelection = resolveLoginSelection();
      const response = await api.post("/public/zitadel/auth/callback", {
        code: loginForm.code,
        email: loginForm.email || undefined,
        product: loginSelection.product,
        redirect_uri: loginSelection.redirect_uri,
      });
      setCallbackResponse(response.data);
      setLoginForm((current) => ({
        ...current,
        product: response.data.product || loginSelection.product,
        refresh_token: response.data.refresh_token || current.refresh_token,
        id_token_hint: response.data.id_token || current.id_token_hint,
      }));
      fetchRecords();
      toast.success("Zitadel tokens retrieved");
    } catch (error) {
      const message = handleApiError(error, "Failed to exchange authorization code");
      setCallbackResponse({ error: message });
      toast.error(message);
    } finally {
      setBusy("callback", false);
    }
  };

  const refreshToken = async () => {
    if (!loginForm.refresh_token) {
      toast.error("Refresh token is required");
      return;
    }
    setBusy("refreshToken", true);
    try {
      const response = await api.post("/public/zitadel/auth/refresh", {
        refresh_token: loginForm.refresh_token,
      });
      setRefreshResponse(response.data);
      setLoginForm((current) => ({
        ...current,
        refresh_token: response.data.refresh_token || current.refresh_token,
        id_token_hint: response.data.id_token || current.id_token_hint,
      }));
      toast.success("Access token refreshed");
    } catch (error) {
      const message = handleApiError(error, "Failed to refresh token");
      setRefreshResponse({ error: message });
      toast.error(message);
    } finally {
      setBusy("refreshToken", false);
    }
  };

  const buildLogoutUrl = async () => {
    setBusy("logout", true);
    try {
      const response = await api.get("/public/zitadel/auth/logout-url", {
        params: {
          product: loginForm.product,
          id_token_hint: loginForm.id_token_hint || undefined,
          state: loginForm.state || undefined,
        },
      });
      setLogoutResponse(response.data);
      toast.success("Logout URL created");
    } catch (error) {
      const message = handleApiError(error, "Failed to build logout URL");
      setLogoutResponse({ error: message });
      toast.error(message);
    } finally {
      setBusy("logout", false);
    }
  };

  const renderInput = (id, label, value, onChange, props = {}) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} {...props} />
    </div>
  );

  const renderSelect = (id, label, value, onValueChange, placeholder, options, disabled = false) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{option.label}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{option.value}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const organizationOptions = organizations.map((org) => ({
    value: org.id,
    label: `${org.name} (${optionId(org.id)})${org.zitadel_org_id ? ` - Zitadel ${optionId(org.zitadel_org_id)}` : ""}`,
  }));

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: `${role.name} (${optionId(role.id)})`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zitadel Workflow Test</h1>
          <p className="mt-1 text-muted-foreground">Run org, user, token, refresh, and logout checks from one screen.</p>
        </div>
        <Button variant="outline" onClick={fetchConfig} disabled={loading.config}>
          {loading.config ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Config
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configuration
          </CardTitle>
          <CardDescription>Loaded from the backend without exposing secrets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Configured</p>
            <Badge variant={config?.configured ? "default" : "destructive"}>{config?.configured ? "Yes" : "No"}</Badge>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground">Domain</p>
            <p className="break-all text-sm font-medium">{config?.domain || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Project ID</p>
            <p className="text-sm font-medium">{config?.project_id || "Not set"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Onboarding
            </CardTitle>
            <CardDescription>Create a local org request, approve it, and verify Zitadel org provisioning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {renderInput("org-name", "Organization Name", orgForm.name, (value) => setOrgForm({ ...orgForm, name: value }))}
              {renderInput("org-email", "Organization Email", orgForm.email, (value) => setOrgForm({ ...orgForm, email: value }), { type: "email" })}
              {renderInput("org-domain", "Domain", orgForm.domain, (value) => setOrgForm({ ...orgForm, domain: value }), { placeholder: "example.com" })}
              {renderInput("org-contact", "Contact Person", orgForm.contact_person, (value) => setOrgForm({ ...orgForm, contact_person: value }))}
              {renderInput("org-phone", "Contact Phone", orgForm.contact_phone, (value) => setOrgForm({ ...orgForm, contact_phone: value }))}
              {renderInput("org-address", "Company Address", orgForm.company_address, (value) => setOrgForm({ ...orgForm, company_address: value }))}
              {renderInput("org-description", "Description", orgForm.description, (value) => setOrgForm({ ...orgForm, description: value }))}
              {renderInput("org-plans", "Plan IDs", orgForm.plan_ids, (value) => setOrgForm({ ...orgForm, plan_ids: value }), { placeholder: "Optional: plan_forgeq_enterprise" })}
              {renderInput("org-tools", "Tool IDs", orgForm.selected_tools, (value) => setOrgForm({ ...orgForm, selected_tools: value }), { placeholder: "Optional comma-separated IDs" })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={submitOrgRequest} disabled={loading.orgRequest}>
                {loading.orgRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                Create Request
              </Button>
              <Button variant="outline" onClick={fetchPricing} disabled={loading.pricing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Load Plans
              </Button>
            </div>

            {pricing.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Plan ID</TableHead>
                      <TableHead>Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricing.flatMap((product) =>
                      (product.plans || []).slice(0, 3).map((plan) => (
                        <TableRow key={`${product.key}-${plan.id}`}>
                          <TableCell>{product.name || product.key}</TableCell>
                          <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                          <TableCell>{plan.name}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            <StatusLine response={orgRequest} />
            <JsonBlock data={orgRequest} />

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              {renderInput("approve-org-id", "Organization Request ID", approveOrgId, setApproveOrgId)}
              <div className="flex items-end">
                <Button onClick={approveOrganization} disabled={loading.approveOrg} className="w-full">
                  {loading.approveOrg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Approve
                </Button>
              </div>
            </div>
            <StatusLine response={approveOrgResponse} />
            <JsonBlock data={approveOrgResponse} />
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Provisioning
          </CardTitle>
          <CardDescription>Create a user request, approve it locally, create the Zitadel user in the organization, and send the verification email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {renderSelect(
              "user-org",
              "Organization",
              userForm.organization_id,
              handleOrganizationSelect,
              loading.organizations ? "Loading organizations..." : "Select organization",
              organizationOptions,
              loading.organizations
            )}
            {renderInput("user-email", "User Email", userForm.email, (value) => setUserForm({ ...userForm, email: value }), { type: "email" })}
            {renderInput("user-name", "User Name", userForm.name, (value) => setUserForm({ ...userForm, name: value }))}
            {renderInput("requested-role", "Requested Role", userForm.requested_role, (value) => setUserForm({ ...userForm, requested_role: value }))}
            {renderSelect(
              "role-id",
              "Approval Role",
              userForm.role_id,
              handleRoleSelect,
              userForm.organization_id ? "Select role" : "Select organization first",
              roleOptions,
              !userForm.organization_id || loading.orgLookups
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchOrgRoles} disabled={loading.orgLookups}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Load Roles
            </Button>
            <Button variant="outline" onClick={fetchOrganizations} disabled={loading.organizations}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Load Organizations
            </Button>
            <Button onClick={submitUserRequest} disabled={loading.userRequest}>
              {loading.userRequest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create User Request
            </Button>
          </div>

          {roles.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>{role.name}</TableCell>
                        <TableCell className="font-mono text-xs">{role.id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <StatusLine response={userRequest} />
          <JsonBlock data={userRequest} />

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            {renderInput("approve-user-request", "User Request ID", approveUserRequestId, setApproveUserRequestId)}
            <div className="flex items-end">
              <Button onClick={approveUser} disabled={loading.approveUser} className="w-full">
                {loading.approveUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve User
              </Button>
            </div>
          </div>
          <StatusLine response={approveUserResponse} />
          <JsonBlock data={approveUserResponse} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Login And Tokens
            </CardTitle>
            <CardDescription>Generate an authorization URL, exchange the code, and refresh the token.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              {renderInput("login-email", "Login Email", loginForm.email, (value) => setLoginForm({ ...loginForm, email: value }), { type: "email" })}
              {renderInput("login-product", "Product", loginForm.product, (value) => setLoginForm({ ...loginForm, product: value }))}
              {renderInput("login-redirect", "Redirect URI Override", loginForm.redirect_uri, (value) => setLoginForm({ ...loginForm, redirect_uri: value }))}
              {renderInput("login-state", "State", loginForm.state, (value) => setLoginForm({ ...loginForm, state: value }))}
            </div>
            {config?.redirect_uris && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(config.redirect_uris).map(([product, redirectUri]) => (
                  <Button
                    key={product}
                    type="button"
                    variant="outline"
                    onClick={() => setLoginForm((current) => ({ ...current, product, redirect_uri: redirectUri }))}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {product}
                  </Button>
                ))}
              </div>
            )}
            <Button onClick={initLogin} disabled={loading.initLogin}>
              {loading.initLogin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Initialize Login
            </Button>
            <JsonBlock data={initResponse} />
            {initResponse?.authorize_url && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(initResponse.authorize_url)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button onClick={() => window.open(initResponse.authorize_url, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Login
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="zitadel-code">Authorization Code</Label>
              <Textarea
                id="zitadel-code"
                value={loginForm.code}
                onChange={(event) => setLoginForm({ ...loginForm, code: event.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={exchangeCode} disabled={loading.callback}>
              {loading.callback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Exchange Code
            </Button>
            <JsonBlock data={callbackResponse} />

            {callbackResponse?.refresh_token && (
              <div className="rounded-md border p-3 text-sm">
                <p className="text-xs text-muted-foreground">Refresh Token</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate">{compactToken(callbackResponse.refresh_token)}</code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(callbackResponse.refresh_token)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Refresh And Logout
            </CardTitle>
            <CardDescription>Call Zitadel refresh-token exchange and build an end-session URL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="refresh-token">Refresh Token</Label>
              <Textarea
                id="refresh-token"
                value={loginForm.refresh_token}
                onChange={(event) => setLoginForm({ ...loginForm, refresh_token: event.target.value })}
                rows={4}
              />
            </div>
            <Button onClick={refreshToken} disabled={loading.refreshToken}>
              {loading.refreshToken ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Refresh Access Token
            </Button>
            <JsonBlock data={refreshResponse} />

            <div className="space-y-2">
              <Label htmlFor="id-token-hint">ID Token Hint</Label>
              <Textarea
                id="id-token-hint"
                value={loginForm.id_token_hint}
                onChange={(event) => setLoginForm({ ...loginForm, id_token_hint: event.target.value })}
                rows={4}
              />
            </div>
            <Button onClick={buildLogoutUrl} disabled={loading.logout}>
              {loading.logout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Build Logout URL
            </Button>
            <JsonBlock data={logoutResponse} />
            {logoutResponse?.logout_url && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(logoutResponse.logout_url)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Logout URL
                </Button>
                <Button onClick={() => window.open(logoutResponse.logout_url, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Logout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Zitadel Login Records
              </CardTitle>
              <CardDescription>Recent callback exchanges stored in MySQL.</CardDescription>
            </div>
            <Button variant="outline" onClick={fetchRecords} disabled={loading.records}>
              {loading.records ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Zitadel Org</TableHead>
                    <TableHead>Zitadel User</TableHead>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.email}</TableCell>
                      <TableCell>{record.organization_name || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{record.zitadel_org_id || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{record.zitadel_user_id || "-"}</TableCell>
                      <TableCell>{record.login_at ? format(new Date(record.login_at), "MMM d, yyyy HH:mm") : "-"}</TableCell>
                      <TableCell>{record.expires_at ? format(new Date(record.expires_at), "MMM d, yyyy HH:mm") : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              {loading.records ? "Loading..." : "No Zitadel login records yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
