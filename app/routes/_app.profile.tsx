import type { Route } from "./+types/_app.profile";
import { useLoaderData, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authRequired } from "~/lib/middleware/auth-required";
import { cloudflareContext } from "~/lib/context";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";

export const middleware: Route.MiddlewareFunction[] = [authRequired];

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

type AgentRow = {
  id: string;
  name?: string | null;
  status: string;
  network?: string | null;
  session_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status_updated_at?: string | null;
  live_started_at?: string | null;
  initial_deposit_usd?: number | null;
  current_balance_usd?: number | null;
  pnl_usd?: number | null;
  pnl_percent?: number | null;
  last_error?: string | null;
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatUsd(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return usdFormatter.format(value);
}

function formatPnlPercent(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${percentFormatter.format(value)}%`;
}

function formatRuntime(startedAt?: string | null, endedAt?: string | null) {
  if (!startedAt) return "-";
  const startMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startMs)) return "-";

  const endMs = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (!Number.isFinite(endMs)) return "-";

  const diffMs = Math.max(0, endMs - startMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  if (totalSeconds < 60) return "<1m";

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function Profile() {
  const { apiUrl, walletAddress } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSessionToken(localStorage.getItem("dt_session_token"));
  }, []);

  const authHeader = useMemo(() => {
    if (!sessionToken) return {};
    return { Authorization: `Bearer ${sessionToken}` };
  }, [sessionToken]);

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
    if (status === "Preparing Trading Account")
      return "bg-blue-500/20 text-blue-200";
    if (status === "Strategy Building") return "bg-blue-500/20 text-blue-200";
    if (status === "Awaiting Deposit") return "bg-amber-500/20 text-amber-200";
    if (status === "Cancelled") return "bg-red-500/20 text-red-200";
    return "bg-white/10 text-white/70";
  };

  const networkClass = (network?: string | null) => {
    if (network === "mainnet") return "bg-rose-500/20 text-rose-200";
    return "bg-cyan-500/20 text-cyan-200";
  };

  const handleCopyWallet = async () => {
    if (!walletAddress) return;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
    window.setTimeout(() => setCopyStatus("idle"), 2000);
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <span className="tag-pill">Profile</span>
            <h1 className="text-4xl md:text-5xl font-display">Your agents</h1>
            <p className="text-lg text-white/70">
              Track every agent state. Onboarding timeouts and strategy timeouts
              are handled automatically.
            </p>
            {walletAddress && (
              <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/75">
                <span className="uppercase tracking-[0.15em] text-white/50">Wallet</span>
                <span className="truncate max-w-[260px] md:max-w-[420px] text-white/85">
                  {walletAddress}
                </span>
                <button
                  type="button"
                  onClick={handleCopyWallet}
                  className="rounded-md border border-white/20 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-white/80 hover:text-white"
                >
                  {copyStatus === "copied"
                    ? "Copied"
                    : copyStatus === "error"
                      ? "Try again"
                      : "Copy"}
                </button>
              </div>
            )}
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
              const updatedAt =
                agent.status_updated_at || agent.updated_at || agent.created_at;
              const startedAt = agent.live_started_at || agent.created_at;
              const endedAt =
                agent.status === "Stopped" || agent.status === "Cancelled"
                  ? agent.status_updated_at || agent.updated_at
                  : null;

              const hasPnlInputs =
                typeof agent.current_balance_usd === "number" &&
                Number.isFinite(agent.current_balance_usd) &&
                typeof agent.initial_deposit_usd === "number" &&
                Number.isFinite(agent.initial_deposit_usd);

              const pnlUsd =
                typeof agent.pnl_usd === "number" && Number.isFinite(agent.pnl_usd)
                  ? agent.pnl_usd
                  : hasPnlInputs
                    ? Number(
                        (
                          (agent.current_balance_usd as number) -
                          (agent.initial_deposit_usd as number)
                        ).toFixed(6)
                      )
                    : null;

              const pnlPercent =
                typeof agent.pnl_percent === "number" && Number.isFinite(agent.pnl_percent)
                  ? agent.pnl_percent
                  : hasPnlInputs && (agent.initial_deposit_usd as number) > 0
                    ? Number(
                        (
                          ((pnlUsd as number) / (agent.initial_deposit_usd as number)) *
                          100
                        ).toFixed(6)
                      )
                    : null;

              const pnlClass =
                typeof pnlUsd === "number"
                  ? pnlUsd >= 0
                    ? "text-emerald-300"
                    : "text-rose-300"
                  : "text-white";

              return (
                <div
                  key={agent.id}
                  className="space-y-3 rounded-xl border-2 border-border bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 text-base font-semibold text-white truncate">
                      {agent.name?.trim() || "Unnamed agent"}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusClass(
                          agent.status
                        )}`}
                      >
                        {agent.status}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${networkClass(
                          agent.network
                        )}`}
                      >
                        {agent.network === "mainnet" ? "Mainnet" : "Testnet"}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">
                          Balance
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {formatUsd(agent.current_balance_usd)}
                        </div>
                        <div className="text-xs text-white/45">
                          Initial {formatUsd(agent.initial_deposit_usd)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                        <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">
                          PnL
                        </div>
                        <div className={`text-sm font-semibold ${pnlClass}`}>
                          {typeof pnlUsd === "number" ? formatUsd(pnlUsd) : "-"}
                        </div>
                        <div className={`text-xs ${pnlClass}`}>
                          {formatPnlPercent(pnlPercent)}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/5 p-2 col-span-2 md:col-span-1">
                        <div className="text-[10px] uppercase tracking-[0.15em] text-white/45">
                          Runtime
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {formatRuntime(startedAt, endedAt)}
                        </div>
                        {updatedAt && (
                          <div className="text-xs text-white/45">
                            Updated {new Date(updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 md:w-[220px] md:self-center">
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        {agent.status === "Strategy Building" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              navigate(`/wizard?agentId=${encodeURIComponent(agent.id)}`)
                            }
                          >
                            Resume
                          </Button>
                        )}

                        {(agent.status === "Live Trading" || agent.status === "Stopped") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate(`/agents/${encodeURIComponent(agent.id)}`)}
                          >
                            Public
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
                      {agent.last_error && (
                        <div className="text-xs text-red-400 md:text-right">
                          {agent.last_error}
                        </div>
                      )}
                    </div>
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
