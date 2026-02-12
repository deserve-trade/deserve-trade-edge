import type { Route } from "./+types/_app.agents.$id";
import { useLoaderData } from "react-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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

function formatPercent(value?: number | null) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value)) {
    return "n/a";
  }
  const sign = Number(value) > 0 ? "+" : "";
  return `${sign}${Number(value).toFixed(2)}%`;
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

function extractErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }
  return fallback;
}

function clampPercent(value?: number | null) {
  if (value === null || typeof value === "undefined" || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, Number(value)));
}

export default function AgentPublicPage() {
  const { apiUrl, agentId } = useLoaderData<typeof loader>();
  const logsViewportRef = useRef<HTMLDivElement | null>(null);
  const restoreScrollRef = useRef<{ height: number; top: number } | null>(null);
  const initializedScrollRef = useRef(false);
  const lastTailRef = useRef("");

  const agentQuery = useQuery({
    queryKey: ["agent-public", apiUrl, agentId],
    enabled: Boolean(apiUrl && agentId),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents/${agentId}/public`, {
        method: "GET",
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, "Failed to load agent."));
      }
      return data as {
        agent: {
          id: string;
          name?: string | null;
          status: string;
          network?: string | null;
          authorWalletAddress?: string | null;
          initialDepositUsd?: number | null;
          currentBalanceUsd?: number | null;
          pnlUsd?: number | null;
          pnlPercent?: number | null;
          currentBalanceUpdatedAt?: string | null;
          aiCreditsRemainingPercent?: number | null;
          aiCreditsResetsIn?: string | null;
          aiCreditsUpdatedAt?: string | null;
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

  const logsQuery = useInfiniteQuery({
    queryKey: ["agent-public-logs", apiUrl, agentId],
    enabled: Boolean(
      apiUrl &&
      agentId &&
      (agentQuery.data?.agent?.status === "Live Trading" ||
        agentQuery.data?.agent?.status === "Stopped")
    ),
    queryFn: async ({ pageParam }) => {
      const before = typeof pageParam === "string" ? pageParam : null;
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (before) params.set("before", before);
      const response = await fetch(`${apiUrl}/agents/${agentId}/public-logs?${params.toString()}`, {
        method: "GET",
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(extractErrorMessage(data, "Failed to load logs."));
      }
      return data as {
        logs: Array<{ id?: string; message: string; kind?: string; created_at?: string }>;
        page?: {
          hasMore?: boolean;
          nextBefore?: string | null;
        };
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.page?.hasMore ? lastPage.page?.nextBefore ?? undefined : undefined,
    refetchInterval: 5000,
    retry: false,
  });

  const logs = useMemo(() => {
    const pages = logsQuery.data?.pages ?? [];
    return [...pages]
      .reverse()
      .flatMap((page) => page.logs ?? []);
  }, [logsQuery.data?.pages]);

  const agent = agentQuery.data?.agent;
  const status = agent?.status ?? "Loading";
  const isPublicVisible = status === "Live Trading" || status === "Stopped";
  const isAgentThinking = status === "Live Trading" && logsQuery.isFetching && !logsQuery.isPending;
  const isLogsLoading = agentQuery.isLoading || logsQuery.isPending;
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
  const pnlUsd = agent?.pnlUsd ?? null;
  const pnlPercent = agent?.pnlPercent ?? null;
  const pnlToneClass =
    Number.isFinite(pnlUsd) && Number(pnlUsd) > 0
      ? "text-emerald-300"
      : Number.isFinite(pnlUsd) && Number(pnlUsd) < 0
        ? "text-rose-300"
        : "text-white";
  const pnlUsdLabel =
    Number.isFinite(pnlUsd) && Number(pnlUsd) > 0
      ? `+${formatUsd(pnlUsd)}`
      : formatUsd(pnlUsd);
  const aiCreditsPercent = clampPercent(agent?.aiCreditsRemainingPercent ?? null);
  const aiCreditsResetIn =
    typeof agent?.aiCreditsResetsIn === "string" && agent.aiCreditsResetsIn.trim()
      ? agent.aiCreditsResetsIn.trim()
      : null;
  const aiCreditsToneClass =
    typeof aiCreditsPercent === "number"
      ? aiCreditsPercent > 40
        ? "text-emerald-300"
        : aiCreditsPercent > 20
          ? "text-amber-300"
          : "text-rose-300"
      : "text-white";

  const fetchOlderLogs = useCallback(async () => {
    if (!logsQuery.hasNextPage || logsQuery.isFetchingNextPage) return;
    const viewport = logsViewportRef.current;
    if (viewport) {
      restoreScrollRef.current = {
        height: viewport.scrollHeight,
        top: viewport.scrollTop,
      };
    }
    await logsQuery.fetchNextPage();
  }, [logsQuery]);

  const handleLogsScroll = useCallback(() => {
    const viewport = logsViewportRef.current;
    if (!viewport) return;
    if (viewport.scrollTop <= 64) {
      void fetchOlderLogs();
    }
  }, [fetchOlderLogs]);

  useEffect(() => {
    const viewport = logsViewportRef.current;
    const restore = restoreScrollRef.current;
    if (!viewport || !restore || logsQuery.isFetchingNextPage) return;
    const heightDiff = viewport.scrollHeight - restore.height;
    viewport.scrollTop = restore.top + Math.max(0, heightDiff);
    restoreScrollRef.current = null;
  }, [logs.length, logsQuery.isFetchingNextPage]);

  const tailKey = useMemo(() => {
    const last = logs[logs.length - 1];
    if (!last) return "";
    return `${last.id ?? "log"}:${last.created_at ?? ""}:${last.kind ?? ""}`;
  }, [logs]);

  useEffect(() => {
    const viewport = logsViewportRef.current;
    if (!viewport || !isPublicVisible) return;
    if (!initializedScrollRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      initializedScrollRef.current = true;
      lastTailRef.current = tailKey;
      return;
    }
    if (tailKey && tailKey !== lastTailRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      lastTailRef.current = tailKey;
    }
  }, [tailKey, isPublicVisible]);

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-3">
          <span className="tag-pill">Agent</span>
          <h1 className="text-4xl md:text-5xl font-display">
            {agent?.name?.trim() || "Public Agent Feed"}
          </h1>
        </header>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusClass}`}>
              {status}
            </span>
            <span
              className={`inline-flex min-w-[122px] items-center justify-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] bg-white/10 text-white/80 transition-opacity duration-200 ${isAgentThinking ? "opacity-100" : "opacity-0"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Balance
              </div>
              <div className="text-2xl font-semibold text-white mt-1">
                {formatUsd(agent?.currentBalanceUsd ?? null)}
              </div>
              <div className="text-[11px] text-white/55 mt-2">
                Initial: {formatUsd(agent?.initialDepositUsd ?? null)}
              </div>
              <div className="text-[11px] text-white/45 mt-1">
                {agent?.currentBalanceUpdatedAt
                  ? `Updated ${new Date(agent.currentBalanceUpdatedAt).toLocaleTimeString()}`
                  : "No snapshot yet"}
              </div>
            </div>
            <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                PnL
              </div>
              <div className={`text-2xl font-semibold mt-1 ${pnlToneClass}`}>{pnlUsdLabel}</div>
              <div className={`text-base font-medium mt-1 ${pnlToneClass}`}>{formatPercent(pnlPercent)}</div>
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

          <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                AI Credits
              </div>
              <div className={`text-sm font-semibold ${aiCreditsToneClass}`}>
                {typeof aiCreditsPercent === "number"
                  ? `${aiCreditsPercent.toFixed(1)}%`
                  : "n/a"}
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full transition-all duration-500 ${typeof aiCreditsPercent === "number"
                  ? aiCreditsPercent > 40
                    ? "bg-emerald-400"
                    : aiCreditsPercent > 20
                      ? "bg-amber-400"
                      : "bg-rose-400"
                  : "bg-white/40"
                  }`}
                style={{ width: `${typeof aiCreditsPercent === "number" ? aiCreditsPercent : 0}%` }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/60">
              <span>
                {aiCreditsResetIn ? `Reset in ${aiCreditsResetIn}` : "Reset time n/a"}
              </span>
              <span>
                {agent?.aiCreditsUpdatedAt
                  ? `Updated ${new Date(agent.aiCreditsUpdatedAt).toLocaleTimeString()}`
                  : "No credit snapshot yet"}
              </span>
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
            <div
              ref={logsViewportRef}
              onScroll={handleLogsScroll}
              className="max-h-[560px] overflow-y-auto rounded-xl border-2 border-border bg-[var(--surface)] p-4 text-sm text-white/80 space-y-3"
            >
              {logsQuery.hasNextPage && (
                <div className="text-xs text-white/40">
                  {logsQuery.isFetchingNextPage ? "Loading older logs..." : "Scroll up to load older logs"}
                </div>
              )}
              <div className="min-h-6 text-white/50">
                <span
                  className={`inline-flex items-center gap-2 transition-opacity duration-200 ${isLogsLoading || isAgentThinking ? "opacity-100" : "opacity-0"
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
              {!isLogsLoading && logs.length === 0 ? (
                <div className="text-white/50">No public updates yet.</div>
              ) : null}
              {logs.map((log, index) => (
                <div key={`${log.id ?? "log"}-${log.created_at ?? "ts"}-${index}`} className="space-y-1">
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
