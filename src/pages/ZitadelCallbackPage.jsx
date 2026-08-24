import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ZitadelCallbackPage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Opening product sign in...");
  const [error, setError] = useState("");

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const oauthErrorDescription = searchParams.get("error_description");

    if (oauthError) {
      setError(oauthErrorDescription || oauthError);
      return;
    }

    const target = new URL("/auth/zitadel/callback", window.location.origin);
    target.search = searchParams.toString();
    window.location.replace(target.toString());
  }, [searchParams]);

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
