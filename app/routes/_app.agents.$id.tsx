import type { Route } from "./+types/_app.agents.$id";
import { useLoaderData } from "react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cloudflareContext } from "~/lib/context";
import { Card } from "~/components/kit/Card";

export function loader({ context, params }: Route.LoaderArgs) {
  const env = context.get(cloudflareContext).env;
  return {
    apiUrl: env.API_URL?.replace(/\/$/, ""),
    agentId: params.id,
  };
}

function formatUsd(value?: number | null) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value)) {
    return "n/a";
  }
  return `$${Number(value).toFixed(2)}`;
}

function formatDuration(fromIso?: string | null) {
  if (!fromIso) return null;
  const start = new Date(fromIso).getTime();
  if (!Number.isFinite(start)) return null;
  const elapsedMs = Date.now() - start;
  if (elapsedMs < 0) return null;
  const sec = Math.floor(elapsedMs / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function AgentPublicPage() {
  const { apiUrl, agentId } = useLoaderData<typeof loader>();

  const agentQuery = useQuery({
    queryKey: ["agent-public", apiUrl, agentId],
    enabled: Boolean(apiUrl && agentId),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents/${agentId}/public`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load agent.");
      }
      return data as {
        agent: {
          id: string;
          status: string;
          network?: string | null;
          authorWalletAddress?: string | null;
          initialDepositUsd?: number | null;
          liveStartedAt?: string | null;
          createdAt?: string | null;
          statusUpdatedAt?: string | null;
          depositAddress?: string | null;
        };
      };
    },
    retry: false,
    refetchInterval: 5000,
  });

  const logsQuery = useQuery({
    queryKey: ["agent-public-logs", apiUrl, agentId],
    enabled: Boolean(
      apiUrl &&
        agentId &&
        (agentQuery.data?.agent?.status === "Live Trading" ||
          agentQuery.data?.agent?.status === "Stopped")
    ),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents/${agentId}/public-logs`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load logs.");
      }
      return data as {
        logs: Array<{ message: string; kind?: string; created_at?: string }>;
      };
    },
    refetchInterval: 5000,
    retry: false,
  });

  const agent = agentQuery.data?.agent;
  const status = agent?.status ?? "Loading";
  const isPublicVisible = status === "Live Trading" || status === "Stopped";
  const isAgentThinking =
    status === "Live Trading" && logsQuery.isFetching && !logsQuery.isLoading;
  const isLogsLoading = agentQuery.isLoading || logsQuery.isLoading;
  const statusClass =
    status === "Live Trading"
      ? "bg-emerald-500/20 text-emerald-200"
      : status === "Stopped"
        ? "bg-red-500/20 text-red-200"
        : "bg-white/10 text-white/80";
  const authorLabel = useMemo(() => {
    const address = agent?.authorWalletAddress;
    if (!address) return "Unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [agent?.authorWalletAddress]);
  const tradingDuration = formatDuration(agent?.liveStartedAt ?? null);

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-3">
          <span className="tag-pill">Agent</span>
          <h1 className="text-4xl md:text-5xl font-display">Public Agent Feed</h1>
          <p className="text-sm text-white/60 break-all">{agentId}</p>
        </header>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusClass}`}>
              {status}
            </span>
            <span
              className={`inline-flex min-w-[122px] items-center justify-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] bg-white/10 text-white/80 transition-opacity duration-200 ${
                isAgentThinking ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={!isAgentThinking}
            >
              <span className="animate-pulse">Thinking</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </span>
            <span className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] bg-cyan-500/20 text-cyan-200">
              {agent?.network === "mainnet" ? "Mainnet" : "Testnet"}
            </span>
            <span className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] bg-white/10 text-white/80">
              Author {authorLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Initial Deposit
              </div>
              <div className="text-lg text-white mt-1">
                {formatUsd(agent?.initialDepositUsd ?? null)}
              </div>
            </div>
            <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Launch Time
              </div>
              <div className="text-sm text-white mt-1">
                {agent?.liveStartedAt
                  ? new Date(agent.liveStartedAt).toLocaleString()
                  : "n/a"}
              </div>
            </div>
            <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Trading Duration
              </div>
              <div className="text-lg text-white mt-1">{tradingDuration || "n/a"}</div>
            </div>
          </div>

          {agent?.depositAddress && (
            <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-3 text-sm text-white/80">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Deposit Address
              </div>
              <div className="break-all">{agent.depositAddress}</div>
            </div>
          )}
        </Card>

        {isPublicVisible ? (
          <Card className="space-y-4">
          <div className="text-sm uppercase tracking-[0.25em] text-white/50">
            Public Log
          </div>
          <div className="max-h-[560px] overflow-y-auto rounded-xl border-2 border-border bg-[var(--surface)] p-4 text-sm text-white/80 space-y-3">
            <div className="min-h-6 text-white/50">
              <span
                className={`inline-flex items-center gap-2 transition-opacity duration-200 ${
                  isLogsLoading || isAgentThinking ? "opacity-100" : "opacity-0"
                }`}
              >
                <span className={isAgentThinking ? "animate-pulse" : ""}>
                  {isLogsLoading ? "Loading updates..." : "Agent is thinking"}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              </span>
            </div>
            {agentQuery.isError ? (
              <div className="text-red-400">
                {agentQuery.error instanceof Error
                  ? agentQuery.error.message
                  : "Failed to load agent."}
              </div>
            ) : null}
            {logsQuery.isError ? (
              <div className="text-red-400">
                {logsQuery.error instanceof Error
                  ? logsQuery.error.message
                  : "Failed to load logs."}
              </div>
            ) : null}
            {!isLogsLoading && logsQuery.data?.logs?.length === 0 ? (
              <div className="text-white/50">No public updates yet.</div>
            ) : null}
            {logsQuery.data?.logs?.map((log, index) => (
              <div key={`${log.created_at ?? "log"}-${index}`} className="space-y-1">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                  {log.kind ?? "log"}
                  {log.created_at ? ` • ${new Date(log.created_at).toLocaleString()}` : ""}
                </div>
                <div className="whitespace-pre-wrap">{log.message}</div>
              </div>
            ))}
          </div>
          </Card>
        ) : (
          <Card className="space-y-2">
            <div className="text-sm text-white/70">
              This page becomes public only when agent status is Live Trading or Stopped.
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
