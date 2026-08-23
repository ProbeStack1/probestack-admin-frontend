import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "../lib/api";

function resolveProduct() {
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return "local";
  if (host.includes("console.probestack")) return "console";
  if (host.includes("forgecatalog")) return "forgecatalog";
  if (host.includes("forgefuzz")) return "forgefuzz";
  return "probestack";
}

const CONSOLE_URL = process.env.REACT_APP_CONSOLE_URL || "https://console.probestack.io";

export default function ZitadelCallbackPage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Completing sign in...");
  const [error, setError] = useState("");
  const redirectUri = useMemo(
    () => `${window.location.origin}/admin/auth/zitadel/callback`,
    []
  );

  useEffect(() => {
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");

    if (oauthError) {
      setError(oauthErrorDescription || oauthError);
      return;
    }

    if (!code) {
      setError("Authorization code is missing.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await api.post("/public/zitadel/auth/callback", {
          code,
          product: resolveProduct(),
          redirect_uri: redirectUri,
        });

        if (!response.data?.success) {
          throw new Error("Zitadel sign in did not complete.");
        }

        setMessage("Signed in. Opening console...");
        window.location.replace(CONSOLE_URL);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to complete sign in.");
      }
    };

    exchangeCode();
  }, [redirectUri, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center space-y-4">
        {!error ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <h1 className="text-xl font-semibold">{message}</h1>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-destructive">Sign in failed</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
