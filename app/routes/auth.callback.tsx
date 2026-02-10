import { ConnectBox, darkTheme, PhantomProvider, useAccounts, usePhantom, useSolana } from "@phantom/react-sdk";
import { AddressType } from "@phantom/browser-sdk";
import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/auth.callback";
import { cloudflareContext } from "~/lib/context";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";
import bs58 from "bs58";

export function loader({ context }: Route.LoaderArgs) {
  const env = context.get(cloudflareContext).env;
  return {
    apiUrl: env.API_URL,
    phantomAppId: env.PHANTOM_APP_ID,
    phantomRedirectUrl: env.PHANTOM_REDIRECT_URL || `${env.DOMAIN}/auth/callback`,
  };
}

export default function PhantomCallback() {
  const { apiUrl, phantomAppId, phantomRedirectUrl } = useLoaderData<typeof loader>();
  const [isClient, setIsClient] = useState(false);
  const [searchParams] = useSearchParams();
  const responseType = searchParams.get("response_type");
  const nextPath = searchParams.get("next") || "/wizard";
  const navigate = useNavigate();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6">
        <div className="max-w-xl mx-auto space-y-4 text-center">
          <h1 className="text-3xl font-display">Finishing sign-in</h1>
          <p className="text-white/70">Loading secure session...</p>
        </div>
      </main>
    );
  }

  return (
    <CallbackBody
      apiUrl={apiUrl}
      responseType={responseType}
      nextPath={nextPath}
      onComplete={() => navigate(nextPath)}
      onReturn={() => navigate(`/connect?next=${encodeURIComponent(nextPath)}`)}
    />
  );
}

type AuthStatus = "idle" | "connecting" | "signing" | "verifying" | "done" | "error";

function CallbackBody({
  apiUrl,
  responseType,
  nextPath,
  onComplete,
  onReturn,
}: {
  apiUrl: string;
  responseType: string | null;
  nextPath: string;
  onComplete: () => void;
  onReturn: () => void;
}) {
  const { isConnected, isLoading } = usePhantom();
  const accounts = useAccounts();
  const { solana } = useSolana();

  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const baseUrl = useMemo(() => apiUrl.replace(/\/$/, ""), [apiUrl]);
  const addressType = AddressType.solana;
  const walletAddress = useMemo(() => {
    const list = accounts ?? [];
    const solAccount = list.find((account) => account.addressType === addressType);
    return solAccount?.address ?? list[0]?.address ?? null;
  }, [accounts, addressType]);

  useEffect(() => {
    if (responseType && responseType !== "success") {
      setStatus("error");
      setError("Sign-in was not completed.");
      return;
    }
    if (!isConnected || !solana || !walletAddress || attempted) return;

    const run = async () => {
      try {
        setAttempted(true);
        setStatus("signing");
        setError(null);

        const messageResponse = await fetch(`${baseUrl}/auth/phantom/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ walletAddress }),
        });

        if (!messageResponse.ok) {
          const { error: messageError } = await messageResponse.json().catch(() => ({
            error: "Failed to get auth message.",
          }));
          setStatus("error");
          setError(messageError ?? "Failed to get auth message.");
          setAttempted(false);
          return;
        }

        const { message, timestamp } = await messageResponse.json<{
          message: string;
          timestamp: string;
        }>();

        const signed = await solana.signMessage(message);
        let signatureValue: string | Uint8Array | undefined;

        if (typeof signed === "string") signatureValue = signed;
        if (signed?.signature instanceof Uint8Array) signatureValue = signed.signature;
        if (signed instanceof Uint8Array) signatureValue = signed;

        const signature =
          typeof signatureValue === "string"
            ? signatureValue
            : signatureValue
              ? bs58.encode(signatureValue)
              : "";

        if (!signature) {
          setStatus("error");
          setError("Signature was not returned.");
          setAttempted(false);
          return;
        }

        setStatus("verifying");
        const verifyResponse = await fetch(`${baseUrl}/auth/phantom/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            walletAddress,
            signature,
            message,
            timestamp,
          }),
        });

        const verifyPayload = await verifyResponse.json().catch(() => ({}));

        if (!verifyResponse.ok) {
          setStatus("error");
          const errorMessage =
            typeof verifyPayload?.error === "string"
              ? verifyPayload.error
              : "Authentication failed.";
          setError(errorMessage);
          setAttempted(false);
          return;
        }

        if (typeof window !== "undefined" && verifyPayload?.token) {
          localStorage.setItem("dt_session_token", String(verifyPayload.token));
        }

        setStatus("done");
        onComplete();
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError("Authentication failed. Try again.");
        setAttempted(false);
      }
    };

    void run();
  }, [attempted, baseUrl, isConnected, onComplete, responseType, solana, walletAddress]);

  useEffect(() => {
    if (status === "done") return;
    if (responseType === "success" && isConnected && attempted) {
      const timeout = window.setTimeout(() => onComplete(), 800);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [attempted, isConnected, onComplete, responseType, status]);

  const statusMessage =
    status === "verifying"
      ? "Verifying session..."
      : status === "signing"
        ? "Confirming signature..."
        : isLoading
          ? "Connecting..."
          : "Completing sign-in...";

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-display">Finishing sign-in</h1>
        <p className="text-white/70">
          {responseType === "success"
            ? "We’re finalizing your session."
            : "We couldn't complete sign-in."}
        </p>
        <Card className="space-y-4 text-left">
          <ConnectBox />
          <div className="text-sm text-white/60">{statusMessage}</div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          {status === "error" && (
            <Button variant="secondary" onClick={() => setAttempted(false)}>
              Retry
            </Button>
          )}
          {responseType === "success" ? (
            <Button onClick={() => onComplete()}>Continue</Button>
          ) : (
            <Button variant="secondary" onClick={() => onReturn()}>
              Return to sign-in
            </Button>
          )}
        </Card>
      </div>
    </main>
  );
}
