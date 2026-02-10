import type { Route } from "./+types/profile";
import { useLoaderData, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authRequired } from "~/lib/middleware/auth-required";
import { cloudflareContext } from "~/lib/context";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";
import { usePhantom } from "@phantom/react-sdk";

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

type AgentRow = {
  id: string;
  status: string;
  session_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status_updated_at?: string | null;
  last_error?: string | null;
};

export default function Profile() {
  const { apiUrl, walletAddress } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { disconnect } = usePhantom();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSessionToken(localStorage.getItem("dt_session_token"));
  }, []);

  const authHeader = useMemo(() => {
    if (!sessionToken) return {};
    return { Authorization: `Bearer ${sessionToken}` };
  }, [sessionToken]);

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
      if (typeof window !== "undefined") {
        localStorage.removeItem("dt_session_token");
        setSessionToken(null);
      }
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      navigate("/connect");
    }
  };

  const agentsQuery = useQuery({
    queryKey: ["agents", apiUrl],
    enabled: Boolean(apiUrl),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents`, {
        method: "GET",
        credentials: "include",
        headers: authHeader,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load agents.");
      }
      return data as { agents: AgentRow[] };
    },
    retry: false,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await agentsQuery.refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      if (!apiUrl) throw new Error("API not configured.");
      const response = await fetch(`${apiUrl}/agents/${agentId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete agent.");
      }
      return data;
    },
    onSuccess: () => {
      agentsQuery.refetch();
    },
  });

  const statusClass = (status: string) => {
    if (status === "Live Trading") return "bg-emerald-500/20 text-emerald-200";
    if (status === "Strategy Building") return "bg-blue-500/20 text-blue-200";
    if (status === "Awaiting Deposit") return "bg-amber-500/20 text-amber-200";
    if (status === "Cancelled") return "bg-red-500/20 text-red-200";
    return "bg-white/10 text-white/70";
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="tag-pill">Profile</span>
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

        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-display">Your agents</h1>
            <p className="text-lg text-white/70">
              Track every agent state. Onboarding timeouts and strategy timeouts
              are handled automatically.
            </p>
          </div>
          <Button
            onClick={() => navigate("/wizard")}
            size="xl"
            className="rounded-full btn-primary"
          >
            Launch New Agent
          </Button>
        </header>

        <Card className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm uppercase tracking-[0.25em] text-white/50">
              Agents
            </div>
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              variant="secondary"
            >
              {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {agentsQuery.isLoading && (
            <div className="text-sm text-white/60">Loading agents...</div>
          )}
          {agentsQuery.isError && (
            <div className="text-sm text-red-400">
              {agentsQuery.error instanceof Error
                ? agentsQuery.error.message
                : "Failed to load agents."}
            </div>
          )}

          {!agentsQuery.isLoading && agentsQuery.data?.agents?.length === 0 && (
            <div className="text-sm text-white/60">No agents yet.</div>
          )}

          <div className="space-y-3">
            {agentsQuery.data?.agents?.map((agent) => {
              const updatedAt = agent.status_updated_at || agent.updated_at || agent.created_at;
              return (
                <div
                  key={agent.id}
                  className="flex flex-col gap-2 rounded-xl border-2 border-border bg-[var(--surface)] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Agent
                    </div>
                    <div className="text-sm text-white/80 break-all">{agent.id}</div>
                    {updatedAt && (
                      <div className="text-xs text-white/50">
                        Updated {new Date(updatedAt).toLocaleString()}
                      </div>
                    )}
                    {agent.last_error && (
                      <div className="text-xs text-red-400">
                        {agent.last_error}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusClass(
                        agent.status
                      )}`}
                    >
                      {agent.status}
                    </span>
                    {agent.status === "Strategy Building" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          navigate(
                            `/wizard?agentId=${encodeURIComponent(agent.id)}`
                          )
                        }
                      >
                        Resume
                      </Button>
                    )}
                    {agent.status !== "Live Trading" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            !window.confirm(
                              "Delete this agent and all its data? This cannot be undone."
                            )
                          ) {
                            return;
                          }
                          deleteMutation.mutate(agent.id);
                        }}
                      >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
