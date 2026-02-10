import { AddressType, darkTheme, PhantomProvider, useDisconnect, useModal, usePhantom } from "@phantom/react-sdk";
import { useEffect, useState } from "react";
import { useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/connect";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";
import { cloudflareContext } from "~/lib/context";

export function loader({ context }: Route.LoaderArgs) {
  const env = context.get(cloudflareContext).env;
  return {
    phantomAppId: env.PHANTOM_APP_ID,
    phantomRedirectUrl: env.PHANTOM_REDIRECT_URL || `${env.DOMAIN}/auth/callback`,
  };
}

export default function Connect() {
  const { phantomAppId, phantomRedirectUrl } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");
  const redirectUrl = nextPath
    ? `${phantomRedirectUrl}?next=${encodeURIComponent(nextPath)}`
    : phantomRedirectUrl;
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
          <WalletComponent />

        </Card>
      </div>
    </main>
  );
}

function WalletComponent() {
  const { open, isOpened } = useModal();
  const { isConnected } = usePhantom();

  const { disconnect } = useDisconnect()

  const handleOpen = () => {
    try {
      open();
    } catch (error) {
      console.log(error);
    }
  };

  if (isConnected) {
    return (
      <div className="space-y-3">
        <div className="text-lg font-semibold">Connected</div>
        <p className="text-sm text-white/60">
          You’re linked. Complete sign-in in the modal.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleOpen} disabled={isOpened}>
            Open sign-in
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
