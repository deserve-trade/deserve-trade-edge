import type { Route } from "./+types/_app";
import { Link, Outlet, useLoaderData, useLocation, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { useDisconnect } from "@phantom/react-sdk";
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

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 -6 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="48" y1="16" x2="48" y2="68" />
        <line x1="18" y1="34" x2="78" y2="34" />
        <line x1="30" y1="26" x2="30" y2="34" />
        <line x1="66" y1="26" x2="66" y2="34" />
        <line x1="48" y1="26" x2="48" y2="34" />
        <path d="M16 54 Q24 62 32 54" />
        <path d="M64 54 Q72 62 80 54" />
      </g>
    </svg>
  );
}

export default function AppLayout() {
  const { apiUrl, walletAddress } = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnect } = useDisconnect();
  const [loggingOut, setLoggingOut] = useState(false);

  const walletLabel = useMemo(() => {
    if (!walletAddress) return "Account";
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const nextPath = `${location.pathname}${location.search}`;
  const loginHref = `/connect?next=${encodeURIComponent(nextPath)}`;
  const loggedOutHref = `/connect?logout=1&next=${encodeURIComponent(nextPath)}`;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await disconnect();
      if (typeof window !== "undefined") {
        localStorage.removeItem("dt_session_token");
        const secureAttr =
          window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `dt_session=; Path=/; Max-Age=0; SameSite=Lax${secureAttr}`;
      }
      if (apiUrl) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
    } finally {
      navigate(loggedOutHref);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b-2 border-border bg-background shadow-[6px_6px_0_#1f1d20]">
        <div className="mx-auto flex h-[var(--header-height)] w-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="brand-lockup">
            <BrandMark className="brand-mark brand-mark-sm" />
            <span className="logo-wordmark logo-wordmark-sm">deserve</span>
          </Link>

          <div className="flex items-center gap-3">
            {walletAddress ? (
              <>
                <Link
                  to="/wizard"
                  className="btn-primary btn-text rounded-full px-4 py-2 text-xs transition hover:translate-y-px"
                >
                  Launch Agent
                </Link>
                <details className="relative">
                  <summary className="list-none cursor-pointer select-none rounded-full bg-[var(--surface)] px-4 py-2 text-sm uppercase tracking-[0.2em] text-white/80 shadow-[6px_6px_0_#1f1d20] hover:text-white">
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
                className="btn-primary btn-text rounded-full px-4 py-2 text-xs transition hover:translate-y-px"
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
