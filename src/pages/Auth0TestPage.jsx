import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { toast } from "sonner";
import { Shield, Mail, ArrowRight, Key, CheckCircle2, XCircle, Copy, ExternalLink, RefreshCw, History } from "lucide-react";
import { api } from "../lib/api";
import { format } from "date-fns";

export default function Auth0TestPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [initResponse, setInitResponse] = useState(null);
  const [callbackResponse, setCallbackResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [loginRecords, setLoginRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    fetchLoginRecords();
  }, []);

  const fetchLoginRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await api.get("/auth0-logins");
      setLoginRecords(response.data);
    } catch (error) {
      console.error("Failed to fetch login records:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleInitAuth = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/public/auth/init", { email });
      setInitResponse(response.data);
      setStep(2);
      toast.success("Auth0 URL generated successfully!");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to initialize auth";
      toast.error(message);
      setInitResponse({ error: message });
    } finally {
      setLoading(false);
    }
  };

  const handleCallback = async () => {
    if (!code) {
      toast.error("Please enter the authorization code");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post("/public/auth/callback", { code, email });
      setCallbackResponse(response.data);
      setStep(4);
      toast.success("Tokens retrieved successfully!");
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to exchange code for tokens";
      toast.error(message);
      setCallbackResponse({ error: message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    // Fallback method for environments where Clipboard API is blocked
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      toast.success("Copied to clipboard!");
    } catch (err) {
      // If even fallback fails, show the text in a prompt
      toast.info("Please copy manually: " + text.substring(0, 50) + "...");
    }
  };

  const openAuthUrl = () => {
    if (initResponse?.authorize_url) {
      window.open(initResponse.authorize_url, "_blank");
      setStep(3);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auth0 Integration Test</h1>
        <p className="text-muted-foreground mt-1">
          Test the Auth0 SSO flow step by step
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={step >= 1 ? "default" : "outline"}>1. Init</Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step >= 2 ? "default" : "outline"}>2. Auth0 URL</Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step >= 3 ? "default" : "outline"}>3. Login & Get Code</Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step >= 4 ? "default" : "outline"}>4. Get Tokens</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1: Initialize Auth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Step 1: Initialize Authentication
            </CardTitle>
            <CardDescription>
              Enter user email to identify organization and generate Auth0 URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@techcorp.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must match a configured organization domain
              </p>
            </div>
            <Button onClick={handleInitAuth} disabled={loading} className="w-full">
              {loading ? "Processing..." : "Initialize Auth"}
            </Button>

            {initResponse && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {initResponse.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {initResponse.success ? "Success" : "Error"}
                  </span>
                </div>
                {initResponse.organization && (
                  <div className="text-sm">
                    <p>Organization: <strong>{initResponse.organization.name}</strong></p>
                    <p>Auth0 Org ID: <code className="text-xs bg-background px-1 rounded">{initResponse.organization.auth0_org_id}</code></p>
                  </div>
                )}
                {initResponse.error && (
                  <p className="text-sm text-destructive">{initResponse.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Auth0 URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Step 2: Open Auth0 Login
            </CardTitle>
            <CardDescription>
              Click the button to open Auth0 login in a new tab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {initResponse?.authorize_url ? (
              <>
                <div className="space-y-2">
                  <Label>Auth0 Authorize URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={initResponse.authorize_url}
                      readOnly
                      className="text-xs font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(initResponse.authorize_url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={openAuthUrl} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Auth0 Login
                </Button>
                <p className="text-xs text-muted-foreground">
                  After login, you'll be redirected to the callback URL with a <code>code</code> parameter.
                  Copy that code for the next step.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Complete Step 1 first to generate the Auth0 URL
              </p>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Enter Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Step 3: Enter Authorization Code
            </CardTitle>
            <CardDescription>
              After Auth0 redirects you, copy the <code>code</code> parameter from the URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Authorization Code</Label>
              <Textarea
                id="code"
                placeholder="QkGiWpCyHleM10y7WnwYBWtm6os89QgI..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                The callback URL looks like: <code>https://probestack.io/callback?code=XXXXX</code>
              </p>
            </div>
            <Button onClick={handleCallback} disabled={loading || !code} className="w-full">
              {loading ? "Exchanging..." : "Exchange Code for Tokens"}
            </Button>
          </CardContent>
        </Card>

        {/* Step 4: Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Step 4: Token Response
            </CardTitle>
            <CardDescription>
              The tokens returned from Auth0
            </CardDescription>
          </CardHeader>
          <CardContent>
            {callbackResponse ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {callbackResponse.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {callbackResponse.success ? "Authentication Successful!" : "Error"}
                  </span>
                </div>

                {callbackResponse.user && (
                  <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                    <p><strong>User Info:</strong></p>
                    <p>Email: {callbackResponse.user.email}</p>
                    <p>Name: {callbackResponse.user.name}</p>
                  </div>
                )}

                {callbackResponse.access_token && (
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <div className="flex gap-2">
                      <Input
                        value={callbackResponse.access_token.substring(0, 50) + "..."}
                        readOnly
                        className="text-xs font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(callbackResponse.access_token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {callbackResponse.id_token && (
                  <div className="space-y-2">
                    <Label>ID Token</Label>
                    <div className="flex gap-2">
                      <Input
                        value={callbackResponse.id_token.substring(0, 50) + "..."}
                        readOnly
                        className="text-xs font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(callbackResponse.id_token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {callbackResponse.error && (
                  <p className="text-sm text-destructive">{callbackResponse.error}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Complete Step 3 to see the tokens
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>
            Use these endpoints from your external application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-2">
            <p className="text-muted-foreground"># Step 1: Get Auth0 URL</p>
            <p>POST /api/public/auth/init</p>
            <p className="text-xs">{"{"}"email": "user@company.com"{"}"}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-2">
            <p className="text-muted-foreground"># Step 2: Exchange code for tokens</p>
            <p>POST /api/public/auth/callback</p>
            <p className="text-xs">{"{"}"code": "authorization_code_from_auth0"{"}"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Login Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Login Records
              </CardTitle>
              <CardDescription>
                All Auth0 login sessions saved in the database
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLoginRecords} disabled={loadingRecords}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingRecords ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loginRecords.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Auth0 Org ID</TableHead>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Expires At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.email}</TableCell>
                      <TableCell>{record.name || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{record.organization_name}</p>
                          {record.external_org_id && (
                            <Badge variant="outline" className="text-xs font-mono mt-1">
                              {record.external_org_id}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.auth0_org_id ? (
                          <code className="text-xs bg-muted px-1 rounded">{record.auth0_org_id}</code>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.login_at ? format(new Date(record.login_at), "MMM d, yyyy HH:mm") : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.expires_at ? format(new Date(record.expires_at), "MMM d, yyyy HH:mm") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {loadingRecords ? "Loading..." : "No login records yet. Complete the Auth0 flow to create a record."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
