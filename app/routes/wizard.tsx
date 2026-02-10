import type { Route } from "./+types/wizard";
import { useLoaderData, useNavigate } from "react-router";
import { authRequired } from "~/lib/middleware/auth-required";
import { Card } from "~/components/kit/Card";
import { cloudflareContext } from "~/lib/context";
import { useMemo, useState } from "react";
import { useDisconnect, usePhantom } from "@phantom/react-sdk";

export const middleware: Route.MiddlewareFunction[] = [authRequired];

export async function loader({ request, context }: Route.LoaderArgs) {
  const apiUrl = context.get(cloudflareContext).env.API_URL?.replace(/\/$/, "");
  const cookie = request.headers.get("cookie") ?? "";
  let walletAddress: string | null = null;

  if (apiUrl) {
    const response = await fetch(`${apiUrl}/auth/session`, {
      headers: { cookie },
    });
    if (response.ok) {
      const data = (await response.json()) as { user?: { walletAddress?: string } };
      walletAddress = data.user?.walletAddress ?? null;
    }
  }

  return { apiUrl, walletAddress };
}

export default function Wizard() {
  const { apiUrl, walletAddress } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const { disconnect } = useDisconnect()

  const walletLabel = useMemo(() => {
    if (!walletAddress) return "Account";
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const handleLogout = async () => {
    if (!apiUrl) {
      navigate("/connect");
      return;
    }
    try {
      setLoggingOut(true);
      disconnect();
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      navigate("/connect");
    }
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="tag-pill">Agent Wizard</span>
          </div>
          <details className="relative">
            <summary className="list-none cursor-pointer select-none rounded-full border-2 border-border bg-[var(--surface)] px-4 py-2 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white">
              {walletLabel}
            </summary>
            <div className="absolute right-0 mt-2 w-40 rounded-xl border-2 border-border bg-[var(--surface)] shadow-[6px_6px_0_#1f1d20] p-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 disabled:opacity-60"
              >
                {loggingOut ? "Signing out..." : "Log out"}
              </button>
            </div>
          </details>
        </div>

        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-display">
            Build your trading strategy
          </h1>
          <p className="text-lg text-white/70">
            This is the protected wizard page. The chat-driven strategy builder
            comes next.
          </p>
        </header>

        <Card className="space-y-4">
          <div className="text-sm uppercase tracking-[0.25em] text-white/50">
            Chat Session
          </div>
          <div className="text-white/80">
            MVP placeholder: the strategy assistant chat UI will live here.
          </div>
        </Card>
      </div>
    </main>
  );
}
