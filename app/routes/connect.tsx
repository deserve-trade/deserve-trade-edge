import { useDisconnect, useModal, usePhantom } from "@phantom/react-sdk";
import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/connect";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";
import { cloudflareContext } from "~/lib/context";

export function loader({ context }: Route.LoaderArgs) {
  const env = context.get(cloudflareContext).env;
  return {
    phantomRedirectUrl: env.PHANTOM_REDIRECT_URL || `${env.DOMAIN}/auth/callback`,
  };
}

export default function Connect() {
  const { phantomRedirectUrl } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");
  const isLogoutFlow = searchParams.get("logout") === "1";
  const isManualFlow = searchParams.get("manual") === "1";
  const callbackHref = useMemo(() => {
    try {
      const url = new URL(
        phantomRedirectUrl,
        typeof window !== "undefined" ? window.location.origin : "http://localhost"
      );
      if (nextPath) {
        url.searchParams.set("next", nextPath);
      }
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return nextPath ? `/auth/callback?next=${encodeURIComponent(nextPath)}` : "/auth/callback";
    }
  }, [nextPath, phantomRedirectUrl]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <span className="tag-pill">Step 1 - Sign in</span>
          <h1 className="text-4xl md:text-5xl font-display">Authorize your account</h1>
          <p className="text-white/60">Preparing secure sign-in...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <span className="tag-pill">Step 1 - Sign in</span>
          <h1 className="text-4xl md:text-5xl font-display">Authorize your account</h1>
          <p className="text-lg text-white/70">
            Sign in to continue to the agent wizard. We’ll create a secure session
            tied to your wallet.
          </p>
        </header>

        <Card className="space-y-4">
          <div className="text-sm uppercase tracking-[0.25em] text-white/50">
            Secure sign-in
          </div>
          <WalletComponent
            callbackHref={callbackHref}
            autoRedirect={!isLogoutFlow && !isManualFlow}
          />

        </Card>
      </div>
    </main>
  );
}

function WalletComponent({
  callbackHref,
  autoRedirect,
}: {
  callbackHref: string;
  autoRedirect: boolean;
}) {
  const navigate = useNavigate();
  const { open, isOpened } = useModal();
  const { isConnected } = usePhantom();
  const { disconnect } = useDisconnect();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleOpen = () => {
    try {
      open();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!autoRedirect || !isConnected || isRedirecting) return;
    setIsRedirecting(true);
    navigate(callbackHref, { replace: true });
  }, [autoRedirect, callbackHref, isConnected, isRedirecting, navigate]);

  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">Connected</div>
        <p className="text-sm text-white/60">
          {autoRedirect
            ? "Wallet linked. Redirecting to secure callback..."
            : "Wallet linked. Press Continue to sign in again."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate(callbackHref, { replace: true })}>
            Continue
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              disconnect();
              handleOpen();
            }}
            disabled={isOpened}
          >
            Switch account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">
        Open the modal to confirm and continue.
      </p>
      <Button onClick={handleOpen} disabled={isOpened}>
        Continue
      </Button>
    </div>
  );
}
