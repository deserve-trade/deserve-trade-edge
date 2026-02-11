import type { Route } from "./+types/_app";
import { Link, Outlet, useLoaderData, useLocation, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { usePhantom } from "@phantom/react-sdk";
import { cloudflareContext } from "~/lib/context";

export async function loader({ request, context }: Route.LoaderArgs) {
  const apiUrl = context.get(cloudflareContext).env.API_URL?.replace(/\/$/, "");
  const cookie = request.headers.get("cookie") ?? "";
  let walletAddress: string | null = null;

  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/auth/session`, {
        headers: { cookie },
      });
      if (response.ok) {
        const data = (await response.json()) as { user?: { walletAddress?: string } };
        walletAddress = data.user?.walletAddress ?? null;
      }
    } catch {
      walletAddress = null;
    }
  }

  return { apiUrl, walletAddress };
}

export default function AppLayout() {
  const { apiUrl, walletAddress } = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = usePhantom();
  const [loggingOut, setLoggingOut] = useState(false);

  const walletLabel = useMemo(() => {
    if (!walletAddress) return "Account";
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const nextPath = `${location.pathname}${location.search}`;
  const loginHref = `/connect?next=${encodeURIComponent(nextPath)}`;

  const handleLogout = async () => {
    if (!apiUrl) {
      navigate(loginHref);
      return;
    }
    try {
      setLoggingOut(true);
      disconnect();
      if (typeof window !== "undefined") {
        localStorage.removeItem("dt_session_token");
      }
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      navigate(loginHref);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0b0b0f]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link
            to="/"
            className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80 hover:text-white"
          >
            Deserve.Trade
          </Link>

          <div className="flex items-center gap-3">
            {walletAddress ? (
              <>
                <Link
                  to="/wizard"
                  className="rounded-full border-2 border-border bg-[var(--primary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:translate-y-px"
                >
                  Launch Agent
                </Link>
                <details className="relative">
                  <summary className="list-none cursor-pointer select-none rounded-full border-2 border-border bg-[var(--surface)] px-4 py-2 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white">
                    {walletLabel}
                  </summary>
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border-2 border-border bg-[var(--surface)] p-2 shadow-[6px_6px_0_#1f1d20]">
                    <Link
                      to="/profile"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                    >
                      Profile
                    </Link>
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
              </>
            ) : (
              <Link
                to={loginHref}
                className="rounded-full border-2 border-border bg-[var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 hover:text-white"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
