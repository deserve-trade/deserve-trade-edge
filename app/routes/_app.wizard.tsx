import type { Route } from "./+types/_app.wizard";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { authRequired } from "~/lib/middleware/auth-required";
import { Card } from "~/components/kit/Card";
import { cloudflareContext } from "~/lib/context";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const seedTriggeredRef = useRef(false);
  const historyHydratedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const redirectedToPublicRef = useRef(false);

  const systemPrompt =
    "You are a trading-strategy assistant for Deserve.Trade. " +
    "Your only tasks are to create and execute trading strategies on the Hyperliquid exchange. " +
    "If a request is outside this scope, decline and explain that only Hyperliquid strategies are supported for now. " +
    "Always respond in a clear, structured way and ask for missing details needed to implement or execute the strategy. " +
    "When you believe the trading strategy is fully specified, send exactly in this format: " +
    "\"Strategy Ready! Should i start to trade? | NAME: <short english name> | DONE\". " +
    "The NAME must be a short conceptual English label for the strategy (no sensitive internals), for example: " +
    "\"ETH-BTC 1 minute scalper\". " +
    "Never include the uppercase word DONE in any other message.";

  const normalizeError = (value: unknown, fallback: string) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const maybeMessage = (value as { message?: unknown }).message;
      if (typeof maybeMessage === "string") return maybeMessage;
    }
    return fallback;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSessionToken(localStorage.getItem("dt_session_token"));
  }, []);

  useEffect(() => {
    if (walletAddress && !withdrawAddress) {
      setWithdrawAddress(walletAddress);
    }
  }, [walletAddress, withdrawAddress]);

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
  const chatEnabled = Boolean(
    agentId && statusQuery.isSuccess && status === "Strategy Building"
  );
  const waitingForGreeting = chatEnabled && !chatReady;
  const isOnboardingStatus = useMemo(
    () =>
      new Set(["Starting", "Onboarding", "Awaiting Redirect Url"]).has(
        String(status)
      ),
    [status]
  );
  const showOnboardingCard = !sessionId || isOnboardingStatus;
  const statusUpdatedAt = statusQuery.data?.statusUpdatedAt ?? null;
  const hasUserMessages = useMemo(
    () => chatHistory.some((message) => message.role === "user"),
    [chatHistory]
  );
  const lastAssistantMessage = useMemo(() => {
    for (let i = chatHistory.length - 1; i >= 0; i -= 1) {
      const message = chatHistory[i];
      if (message.role === "assistant" && message.content?.trim()) {
        return message.content;
      }
    }
    return "";
  }, [chatHistory]);
  const canConfirm = useMemo(
    () =>
      /\bDONE\b/.test(lastAssistantMessage) &&
      /(?:^|\|)\s*(?:NAME|AGENT_NAME)\s*:\s*[^|\n\r]{2,120}/i.test(
        lastAssistantMessage
      ),
    [lastAssistantMessage]
  );

  useEffect(() => {
    if (!agentId) return;
    if (status !== "Live Trading") {
      redirectedToPublicRef.current = false;
      return;
    }
    if (redirectedToPublicRef.current) return;
    redirectedToPublicRef.current = true;
    navigate(`/agents/${encodeURIComponent(agentId)}`, { replace: true });
  }, [agentId, navigate, status]);

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

  const depositRemainingMs = useMemo(() => {
    if (status !== "Awaiting Deposit" || !statusUpdatedAt) return null;
    const deadline = new Date(statusUpdatedAt).getTime() + 60 * 60 * 1000;
    return Math.max(0, deadline - nowTs);
  }, [nowTs, status, statusUpdatedAt]);

  const onboardingRemainingMs = useMemo(() => {
    if (!statusUpdatedAt) return null;
    if (!isOnboardingStatus) return null;
    const deadline = new Date(statusUpdatedAt).getTime() + 5 * 60 * 1000;
    return Math.max(0, deadline - nowTs);
  }, [isOnboardingStatus, nowTs, statusUpdatedAt]);

  useEffect(() => {
    if (!statusUpdatedAt) return;
    const timerStatuses = new Set([
      "Strategy Building",
      "Awaiting Deposit",
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

  const publicAgentQuery = useQuery({
    queryKey: ["agent-public", apiUrl, agentId],
    enabled: Boolean(apiUrl && agentId),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents/${agentId}/public`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to load agent."));
      }
      return data as {
        agent: {
          id: string;
          name?: string | null;
          status: string;
          createdAt?: string | null;
          statusUpdatedAt?: string | null;
          depositAddress?: string | null;
        };
      };
    },
    retry: false,
  });

  const publicLogsQuery = useQuery({
    queryKey: ["agent-public-logs", apiUrl, agentId],
    enabled: Boolean(
      apiUrl && agentId && status !== "Strategy Building" && !isOnboardingStatus
    ),
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/agents/${agentId}/public-logs`, {
        method: "GET",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to load logs."));
      }
      return data as {
        logs: Array<{ message: string; kind?: string; created_at?: string }>;
      };
    },
    refetchInterval: 5000,
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

  const extractTextContent = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (!value) return "";
    if (Array.isArray(value)) {
      return value
        .map((part) => extractTextContent(part))
        .filter(Boolean)
        .join("\n")
        .trim();
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (typeof record.text === "string") return record.text.trim();
      if (typeof record.content === "string") return record.content.trim();
      if (Array.isArray(record.content)) return extractTextContent(record.content);
      if (record.message) return extractTextContent(record.message);
      if (record.delta) return extractTextContent(record.delta);
    }
    return "";
  };

  const extractReply = (data: unknown) => {
    const choice = (data as { choices?: Array<Record<string, unknown>> })?.choices?.[0];
    if (!choice) return "";
    const fromMessage = extractTextContent(
      (choice.message as Record<string, unknown> | undefined)?.content
    );
    if (fromMessage) return fromMessage;
    const fromDelta = extractTextContent(
      (choice.delta as Record<string, unknown> | undefined)?.content
    );
    if (fromDelta) return fromDelta;
    return extractTextContent(choice.text);
  };

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
      setChatReady(true);
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
            : [{ role: "assistant" as const, content: String(reply) }]
        );
      } else {
        setChatError("Agent returned an empty response. Please send a message.");
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
          { role: "assistant" as const, content: String(reply) },
        ]);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: String(reply) },
        ]);
      } else {
        setChatError("Agent returned an empty response.");
      }
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to send message.";
      setChatError(message);
    },
  });

  const isAgentThinking =
    waitingForGreeting || seedMutation.isPending || sendMutation.isPending;

  useEffect(() => {
    if (sendMutation.isPending) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [sendMutation.isPending]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!apiUrl || !agentId) throw new Error("Missing agent.");
      const response = await fetch(`${apiUrl}/agents/${agentId}/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to confirm strategy."));
      }
      return data;
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to confirm strategy.";
      setChatError(message);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!apiUrl || !agentId) throw new Error("Missing agent.");
      const destination = withdrawAddress.trim();
      if (!destination) throw new Error("Destination address is required.");
      const response = await fetch(`${apiUrl}/agents/${agentId}/withdraw`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ destination }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(normalizeError(data.error, "Failed to withdraw."));
      }
      return data as { amount?: number };
    },
    onSuccess: (data) => {
      setWithdrawMessage(
        data?.amount
          ? `Withdrawal submitted (${data.amount.toFixed(2)} USDC).`
          : "Withdrawal submitted."
      );
      setWithdrawAddress("");
      publicLogsQuery.refetch();
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : "Failed to withdraw.";
      setWithdrawMessage(message);
    },
  });

  useEffect(() => {
    if (status === "Strategy Building") return;
    setChatMessages([]);
    setChatHistory([]);
    setChatReady(false);
    setWithdrawMessage(null);
  }, [status]);

  const sendChat = () => {
    if (!apiUrl || !agentId || !chatReady) return;
    const content = chatInput.trim();
    if (!content) return;
    const baseHistory = [
      { role: "system" as const, content: systemPrompt },
      ...chatHistory.filter((message) => message.role !== "system"),
    ];
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
        <header className="space-y-3">
          <span className="tag-pill">Agent Wizard</span>
          <h1 className="text-4xl md:text-5xl font-display">
            Build your trading strategy
          </h1>
          <div>
            <p className="text-lg text-white/70">
              Currently, only the Hyperliquid testnet is available and only the OpenAI Codex language model is available for the agent.
            </p>
          </div>

        </header>

        {showOnboardingCard && (
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
                {isAgentThinking && !waitingForGreeting && (
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
                <textarea
                  value={chatInput}
                  onChange={(event) => {
                    const next = event.target.value;
                    setChatInput(next);
                    event.target.style.height = "auto";
                    event.target.style.height = `${event.target.scrollHeight}px`;
                  }}
                  rows={3}
                  className="w-full resize-none rounded-lg border-2 border-border bg-transparent px-3 py-2 text-sm text-white/80 focus:outline-none"
                  placeholder={
                    waitingForGreeting
                      ? "Waiting for the agent..."
                      : "Describe your strategy..."
                  }
                  disabled={
                    isAgentThinking || confirmMutation.isPending
                  }
                />
                <Button
                  onClick={sendChat}
                  disabled={
                    isAgentThinking || confirmMutation.isPending
                  }
                >
                  {isAgentThinking ? "Thinking..." : "Send"}
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {canConfirm ? (
                  <Button
                    variant="secondary"
                    disabled={confirmMutation.isPending || !chatReady}
                    onClick={() => confirmMutation.mutate()}
                  >
                    {confirmMutation.isPending
                      ? "Confirming..."
                      : "Confirm strategy"}
                  </Button>
                ) : (
                  <span className="text-xs text-white/50">
                    The agent will offer confirmation once the strategy is complete.
                  </span>
                )}
              </div>
              {chatError && <div className="text-sm text-red-400">{chatError}</div>}
            </div>
          </Card>
        )}

        {!isOnboardingStatus && status !== "Strategy Building" && agentId && (
          <Card className="space-y-4">
            <div className="text-sm uppercase tracking-[0.25em] text-white/50">
              Agent Updates
            </div>
            <div className="space-y-2 text-sm text-white/80">
              {publicAgentQuery.data?.agent?.name && (
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/60">
                  <span>Name</span>
                  <span className="text-white/90 normal-case tracking-normal">
                    {publicAgentQuery.data.agent.name}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/60">
                <span>Status</span>
                <span className="text-white/80">{status}</span>
              </div>
              {status === "Awaiting Deposit" && depositRemainingMs !== null && (
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Time left before auto-cancel:{" "}
                  <span className="text-white/80">
                    {formatDuration(depositRemainingMs)}
                  </span>
                </div>
              )}
              {status === "Awaiting Deposit" &&
                publicAgentQuery.data?.agent?.depositAddress && (
                <div className="rounded-xl border-2 border-border bg-[var(--surface)] p-3 text-sm text-white/80">
                  <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                    Deposit Address
                  </div>
                  <div className="break-all">
                    {publicAgentQuery.data.agent.depositAddress}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Public log
                </div>
                {status === "Live Trading" &&
                  publicLogsQuery.isFetching &&
                  !publicLogsQuery.isLoading && (
                    <div className="inline-flex items-center gap-2 text-xs text-white/50">
                      <span className="animate-pulse">Agent is thinking</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    </div>
                  )}
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border-2 border-border bg-[var(--surface)] p-4 text-sm text-white/80 space-y-3">
                {publicLogsQuery.isLoading && (
                  <div className="text-white/50">Loading updates...</div>
                )}
                {publicLogsQuery.isError && (
                  <div className="text-red-400">
                    {publicLogsQuery.error instanceof Error
                      ? publicLogsQuery.error.message
                      : "Failed to load logs."}
                  </div>
                )}
                {!publicLogsQuery.isLoading &&
                  publicLogsQuery.data?.logs?.length === 0 && (
                    <div className="text-white/50">No public updates yet.</div>
                  )}
                {publicLogsQuery.data?.logs?.map((log, index) => (
                  <div key={`${log.created_at ?? "log"}-${index}`} className="space-y-1">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {log.kind ?? "log"}
                    </div>
                    <div className="whitespace-pre-wrap">{log.message}</div>
                  </div>
                ))}
              </div>
            </div>
            {status === "Stopped" && (
              <div className="space-y-3 rounded-xl border-2 border-border bg-[var(--surface)] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Withdraw balance
                </div>
                <input
                  value={withdrawAddress}
                  onChange={(event) => setWithdrawAddress(event.target.value)}
                  className="w-full rounded-lg border-2 border-border bg-transparent px-3 py-2 text-sm text-white/80 focus:outline-none"
                  placeholder="Destination address (0x...)"
                  disabled={withdrawMutation.isPending}
                />
                <Button
                  variant="secondary"
                  onClick={() => withdrawMutation.mutate()}
                  disabled={withdrawMutation.isPending}
                >
                  {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
                </Button>
                {withdrawMessage && (
                  <div className="text-xs text-white/60">{withdrawMessage}</div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
