import type { Route } from "./+types/wizard";
import { Link, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { authRequired } from "~/lib/middleware/auth-required";
import { Card } from "~/components/kit/Card";
import { cloudflareContext } from "~/lib/context";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePhantom } from "@phantom/react-sdk";
import { Button } from "~/components/ui/button";

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

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export default function Wizard() {
  const { apiUrl, walletAddress } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loggingOut, setLoggingOut] = useState(false);
  const { disconnect } = usePhantom();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [redirectInput, setRedirectInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSeeded, setChatSeeded] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const seedTriggeredRef = useRef(false);
  const historyHydratedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const systemPrompt =
    "You are a trading-strategy assistant for Deserve.Trade. " +
    "Your only tasks are to create and execute trading strategies on the Hyperliquid exchange. " +
    "If a request is outside this scope, decline and explain that only Hyperliquid strategies are supported for now. " +
    "Always respond in a clear, structured way and ask for missing details needed to implement or execute the strategy.";

  const normalizeError = (value: unknown, fallback: string) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const maybeMessage = (value as { message?: unknown }).message;
      if (typeof maybeMessage === "string") return maybeMessage;
    }
    return fallback;
  };

  const walletLabel = useMemo(() => {
    if (!walletAddress) return "Account";
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSessionToken(localStorage.getItem("dt_session_token"));
  }, []);

  useEffect(() => {
    if (sessionId && agentId) return;
    const sessionFromQuery = searchParams.get("sessionId");
    const agentFromQuery = searchParams.get("agentId");
    if (!sessionId && sessionFromQuery) {
      setSessionId(sessionFromQuery);
    }
    if (!agentId && agentFromQuery) {
      setAgentId(agentFromQuery);
    }
  }, [agentId, searchParams, sessionId]);

  useEffect(() => {
    historyHydratedRef.current = false;
  }, [agentId]);

  const authHeader = useMemo(() => {
    if (!sessionToken) return {};
    return { Authorization: `Bearer ${sessionToken}` };
  }, [sessionToken]);

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

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!apiUrl) throw new Error("API not configured.");
      const response = await fetch(`${apiUrl}/agents/start`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to start onboarding."));
      }
      return data as {
        sessionId: string;
        agentId?: string;
        status?: string;
        authUrl?: string | null;
        needsUserInput?: boolean;
      };
    },
    onMutate: () => {
      setError(null);
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setAgentId(data.agentId ?? null);
      setChatMessages([]);
      setChatHistory([]);
      setChatReady(false);
      setChatSeeded(false);
      historyHydratedRef.current = false;
      seedTriggeredRef.current = false;
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to start onboarding.";
      setError(message);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!apiUrl || !sessionId) throw new Error("Missing session.");
      const response = await fetch(`${apiUrl}/agents/${sessionId}/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ redirectUrl: value }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to submit code."));
      }
      return data;
    },
    onMutate: () => {
      setError(null);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to submit code.";
      setError(message);
    },
  });

  const statusLookupId = sessionId ?? agentId;

  const statusQuery = useQuery({
    queryKey: ["agent-status", apiUrl, statusLookupId],
    enabled: Boolean(apiUrl && statusLookupId),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents/${statusLookupId}/status`, {
        method: "GET",
        credentials: "include",
        headers: authHeader,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to fetch status."));
      }
      return data as {
        status?: string;
        authUrl?: string | null;
        needsUserInput?: boolean;
        logs?: Array<{ at: number; line: string }>;
        agentId?: string;
        sessionId?: string;
        statusUpdatedAt?: string | null;
      };
    },
    refetchInterval: 2500,
    retry: false,
  });

  useEffect(() => {
    if (statusQuery.data?.agentId && !agentId) {
      setAgentId(statusQuery.data.agentId);
    }
    if (statusQuery.data?.sessionId && !sessionId) {
      setSessionId(statusQuery.data.sessionId);
    }
  }, [agentId, sessionId, statusQuery.data?.agentId, statusQuery.data?.sessionId]);

  const status = statusQuery.data?.status ?? startMutation.data?.status ?? "idle";
  const authUrl = statusQuery.data?.authUrl ?? startMutation.data?.authUrl ?? null;
  const needsUserInput = Boolean(
    statusQuery.data?.needsUserInput ?? startMutation.data?.needsUserInput
  );
  const logs = statusQuery.data?.logs ?? [];
  const chatEnabledStatuses = useMemo(
    () =>
      new Set([
        "Strategy Building",
        "Agent Warmup",
        "Awaiting Gateway",
        "Awaiting Deposit",
        "Live Trading",
      ]),
    []
  );
  const statusReady =
    statusQuery.isSuccess && chatEnabledStatuses.has(String(status));
  const chatEnabled = Boolean(agentId && statusReady);
  const waitingForGreeting = chatEnabled && !chatReady;
  const statusUpdatedAt = statusQuery.data?.statusUpdatedAt ?? null;

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => String(value).padStart(2, "0");
    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  };

  const strategyRemainingMs = useMemo(() => {
    if (status !== "Strategy Building" || !statusUpdatedAt) return null;
    const deadline = new Date(statusUpdatedAt).getTime() + 60 * 60 * 1000;
    return Math.max(0, deadline - nowTs);
  }, [nowTs, status, statusUpdatedAt]);

  const onboardingRemainingMs = useMemo(() => {
    if (!statusUpdatedAt) return null;
    const onboardingStatuses = new Set([
      "Starting",
      "Onboarding",
      "Awaiting Redirect Url",
    ]);
    if (!onboardingStatuses.has(status)) return null;
    const deadline = new Date(statusUpdatedAt).getTime() + 5 * 60 * 1000;
    return Math.max(0, deadline - nowTs);
  }, [nowTs, status, statusUpdatedAt]);

  useEffect(() => {
    if (!statusUpdatedAt) return;
    const timerStatuses = new Set([
      "Strategy Building",
      "Starting",
      "Onboarding",
      "Awaiting Redirect Url",
    ]);
    if (!timerStatuses.has(status)) return;
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status, statusUpdatedAt]);

  const historyQuery = useQuery({
    queryKey: ["agent-messages", apiUrl, agentId],
    enabled: Boolean(apiUrl && agentId && chatEnabled),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents/${agentId}/messages`, {
        method: "GET",
        credentials: "include",
        headers: authHeader,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to load messages."));
      }
      return data as {
        messages: Array<{ role: string; content: string; created_at?: string }>;
      };
    },
    retry: false,
  });

  useEffect(() => {
    if (!historyQuery.isSuccess || historyHydratedRef.current) return;
    const messages = historyQuery.data?.messages ?? [];
    if (messages.length === 0) {
      historyHydratedRef.current = true;
      return;
    }
    historyHydratedRef.current = true;
    const normalizedHistory: ChatMessage[] = messages.map((message) => ({
      role: message.role as ChatMessage["role"],
      content: message.content,
    }));
    const visibleMessages = normalizedHistory.filter(
      (message) => message.role !== "system"
    ) as Array<{ role: "user" | "assistant"; content: string }>;
    setChatHistory(normalizedHistory);
    setChatMessages(visibleMessages);
    setChatReady(true);
    setChatSeeded(true);
  }, [historyQuery.data, historyQuery.isSuccess]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, waitingForGreeting]);

  const extractReply = (data: unknown) =>
    (data as { choices?: Array<{ message?: { content?: string }; delta?: { content?: string }; text?: string }> })
      ?.choices?.[0]?.message?.content ??
    (data as { choices?: Array<{ message?: { content?: string }; delta?: { content?: string }; text?: string }> })
      ?.choices?.[0]?.delta?.content ??
    (data as { choices?: Array<{ message?: { content?: string }; delta?: { content?: string }; text?: string }> })
      ?.choices?.[0]?.text ??
    "";

  const seedMutation = useMutation({
    mutationFn: async () => {
      if (!apiUrl || !agentId) throw new Error("Missing agent.");
      const seedUser =
        "Start with a short greeting and ask me to describe the trading strategy. " +
        "Tell me the best way to describe it (markets, timeframe, entry/exit, risk, position sizing, and constraints).";
      const payloadMessages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: seedUser },
      ];
      const response = await fetch(`${apiUrl}/agents/${agentId}/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          messages: payloadMessages,
          user: walletAddress ?? undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to start chat."));
      }
      return { data, seedUser };
    },
    onSuccess: ({ data, seedUser }) => {
      const reply = extractReply(data);
      if (reply) setChatReady(true);
      setChatHistory((prev) =>
        prev.length > 0
          ? prev
          : [
              { role: "system", content: systemPrompt },
              { role: "user", content: seedUser },
              ...(reply ? [{ role: "assistant", content: String(reply) }] : []),
            ]
      );
      if (reply) {
        setChatMessages((prev) =>
          prev.length > 0
            ? prev
            : [{ role: "assistant", content: String(reply) }]
        );
      }
      setChatSeeded(true);
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to start chat.";
      setChatError(message);
      setChatSeeded(true);
    },
  });

  useEffect(() => {
    if (!chatEnabled || chatSeeded) return;
    if (!historyQuery.isSuccess) return;
    if (historyQuery.data?.messages?.length) return;
    if (seedTriggeredRef.current || seedMutation.isPending) return;
    seedTriggeredRef.current = true;
    seedMutation.mutate(undefined, {
      onSettled: () => {
        seedTriggeredRef.current = false;
      },
    });
  }, [chatEnabled, chatSeeded, historyQuery.data, historyQuery.isSuccess, seedMutation]);

  const sendMutation = useMutation({
    mutationFn: async (payload: { messages: ChatMessage[]; user?: string }) => {
      if (!apiUrl || !agentId) throw new Error("Missing agent.");
      const response = await fetch(`${apiUrl}/agents/${agentId}/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to send message."));
      }
      return data;
    },
    onSuccess: (data) => {
      const reply = extractReply(data);
      if (reply) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: String(reply) },
        ]);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: String(reply) },
        ]);
      }
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to send message.";
      setChatError(message);
    },
  });

  useEffect(() => {
    if (sendMutation.isPending) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [sendMutation.isPending]);

  const sendChat = () => {
    if (!apiUrl || !agentId || !chatReady) return;
    const content = chatInput.trim();
    if (!content) return;
    const baseHistory = chatHistory.some((msg) => msg.role === "system")
      ? chatHistory
      : [{ role: "system" as const, content: systemPrompt }, ...chatHistory];
    const nextHistory = [...baseHistory, { role: "user" as const, content }];
    setChatHistory(nextHistory);
    setChatMessages((prev) => [...prev, { role: "user", content }]);
    setChatInput("");
    setChatError(null);
    sendMutation.mutate({
      messages: nextHistory,
      user: walletAddress ?? undefined,
    });
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

        {!chatEnabled && (
          <Card className="space-y-4">
            <div className="text-sm uppercase tracking-[0.25em] text-white/50">
              Agent Onboarding
            </div>
            {onboardingRemainingMs !== null && (
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Time left before auto-cancel:{" "}
                <span className="text-white/80">
                  {formatDuration(onboardingRemainingMs)}
                </span>
              </div>
            )}
            <div className="text-white/80 space-y-4">
              <p>
                Start the OpenAI Codex onboarding for your agent. We’ll connect your
                Codex session and keep it attached to this wallet.
              </p>
              {!sessionId && (
                <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                  {startMutation.isPending ? "Starting..." : "Start onboarding"}
                </Button>
              )}
              {error && <div className="text-sm text-red-400">{error}</div>}
              {sessionId && (
                <div className="space-y-3 rounded-xl border-2 border-border bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-white/60">
                    <span>Status</span>
                    <span className="text-white/80">{status}</span>
                  </div>
                  {authUrl && (
                    <div className="space-y-2">
                      <div className="text-sm text-white/60">
                        Open the login link:
                      </div>
                      <a
                        href={authUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary underline"
                      >
                        Continue with OpenAI
                      </a>
                    </div>
                  )}
                  {needsUserInput && (
                    <div className="space-y-2">
                      <div className="text-sm text-white/60">
                        Paste the redirect URL or authorization code:
                      </div>
                      <input
                        value={redirectInput}
                        onChange={(event) => setRedirectInput(event.target.value)}
                        className="w-full rounded-lg border-2 border-border bg-transparent px-3 py-2 text-sm text-white/80 focus:outline-none"
                        placeholder="Paste redirect URL"
                      />
                      <Button
                        onClick={() => submitMutation.mutate(redirectInput.trim())}
                        disabled={submitMutation.isPending}
                      >
                        {submitMutation.isPending ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  )}
                  {logs.length > 0 && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2 text-xs text-white/60">
                      {logs.map((log) => (
                        <div key={`${log.at}-${log.line}`}>{log.line}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {chatEnabled && (
          <Card className="space-y-4">
            <div className="text-sm uppercase tracking-[0.25em] text-white/50">
              Strategy Chat
            </div>
            {status === "Strategy Building" && strategyRemainingMs !== null && (
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                Time left before auto-cancel:{" "}
                <span className="text-white/80">
                  {formatDuration(strategyRemainingMs)}
                </span>
              </div>
            )}
            <div className="space-y-4">
              <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border-2 border-border bg-[var(--surface)] p-4 text-sm text-white/80">
                {chatMessages.length === 0 && (
                  <div className="text-white/50">
                    {waitingForGreeting
                      ? "Connecting your agent..."
                      : "Describe your trading strategy and I’ll translate it into a plan."}
                  </div>
                )}
                {waitingForGreeting && (
                  <div className="inline-flex items-center gap-2 text-white/50">
                    <span className="animate-pulse">Waiting for the agent</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  </div>
                )}
                {chatMessages.map((msg, index) => (
                  <div key={`${msg.role}-${index}`} className="space-y-1">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {msg.role}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {sendMutation.isPending && (
                  <div className="space-y-1 text-white/50">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                      assistant
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="animate-pulse">Thinking</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  className="w-full rounded-lg border-2 border-border bg-transparent px-3 py-2 text-sm text-white/80 focus:outline-none"
                  placeholder={
                    waitingForGreeting
                      ? "Waiting for the agent..."
                      : "Describe your strategy..."
                  }
                  disabled={sendMutation.isPending || waitingForGreeting}
                />
                <Button
                  onClick={sendChat}
                  disabled={sendMutation.isPending || waitingForGreeting}
                >
                  {sendMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
              {chatError && <div className="text-sm text-red-400">{chatError}</div>}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
