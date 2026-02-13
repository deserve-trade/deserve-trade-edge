import type { Route } from "./+types/_index";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useLoaderData } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";
import { FaCopy, FaGithub, FaTwitter } from "react-icons/fa6";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { faq } from "~/lib/data/faq";
import { cloudflareContext } from "~/lib/context";
import { token } from "~/lib/data/token";

export function meta({ loaderData }: Route.MetaArgs) {
  const image = `${loaderData.domain}/snippet.png`;
  const title = "Deserve — Agentic Capital Launchpad";
  const description =
    "Launch agentic trading bots, tokenize performance, and trade in public. Describe AI agents in plain text; investors back the best.";

  const titleElements = [
    { title: title },
    {
      name: "twitter:title",
      content: title,
    },
    {
      property: "og:title",
      content: title,
    },
  ];
  const descriptionElements = [
    {
      name: "description",
      content: description,
    },
    {
      name: "twitter:description",
      content: description,
    },
    {
      property: "og:description",
      content: description,
    },
    {
      name: "keywords",
      content:
        "Trading, Perps, DEX, Prop Trading, DeFi, Futures, Launchpad, Tokens, Crypto, On-chain, Capital Market, AI Agents, Agentic, LLM",
    },
  ];
  const imageElements = [
    {
      name: "twitter:image",
      content: image,
    },
    {
      property: "og:image",
      content: image,
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
  ];
  return [
    ...titleElements,
    ...descriptionElements,
    ...imageElements,
    {
      property: "og:url",
      content: `${loaderData.domain}`,
    },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: "Deserve.Trade" },
    { property: "og:locale", content: "en_US" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  const env = context.get(cloudflareContext).env;
  return {
    domain: env.DOMAIN,
    apiUrl: env.API_URL?.replace(/\/$/, "") || "",
  };
}

const AGENT_PROMPTS = [
  "Agent trades on Hyperliquid. Buys when 4h candle closes above MA(52). Risk/Reward 1:5. Max risk 2% of deposit.",
  "Agent scalps ETH-PERP on 15m: enter on RSI < 25 with orderbook imbalance. TP at VWAP, SL at 1.2x ATR.",
  "Market-making agent on BTC: spread 25-45 bps, inventory cap 4%, stop trading if 1h vol > 6%.",
  "Agent trades SOL trend: long after 1D breakout + retest, trail stop 2x ATR, risk 1% per trade.",
];

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

function PumpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 11l-3-3-2 2-2-1" />
      <path d="M13 16v-4h4" />
    </svg>
  );
}

export default function Home() {
  const flowSection = useRef<HTMLDivElement>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const [flowVisible, setFlowVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyAddress = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyStatus("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(dsrvContractAddress);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => setCopyStatus("idle"), 2400);
  };

  useEffect(() => {
    const fullText = AGENT_PROMPTS[promptIndex];
    let timeoutId: number;

    if (phase === "typing") {
      if (displayText.length < fullText.length) {
        timeoutId = window.setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }, 26);
      } else {
        timeoutId = window.setTimeout(() => setPhase("pausing"), 1100);
      }
    } else if (phase === "pausing") {
      timeoutId = window.setTimeout(() => setPhase("deleting"), 600);
    } else {
      if (displayText.length > 0) {
        timeoutId = window.setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length - 1));
        }, 18);
      } else {
        setPhase("typing");
        setPromptIndex((index) => (index + 1) % AGENT_PROMPTS.length);
      }
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [displayText, phase, promptIndex]);

  useEffect(() => {
    const element = flowSection.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFlowVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const copyButtonLabel =
    copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Try again" : "Copy address";
  const copyHint =
    copyStatus === "copied"
      ? "Copied to clipboard"
      : copyStatus === "error"
        ? "Clipboard access denied"
        : "Click to copy address";


  const steps = [
    {
      title: "Launch agent",
      subtitle: "Mint token",
      text: "Describe the strategy in free text, set the venue and rules, then mint the agent token.",
      video: '/videos/prompt-to-agent.mp4'
    },
    {
      title: "Validate strategy",
      subtitle: "Raise funds",
      text: "Agents trade in test mode while the market prices them on the bonding curve.",
      video: '/videos/bonding-curve.mp4'
    },
    {
      title: "Get funded",
      subtitle: "Seed capital",
      text: "Once the curve is completed, liquidity migrates to the DEX and the raised funds are transferred to the agent.",
      video: '/videos/get-funded-2.mp4'
    },
  ];

  const pillars = [
    {
      title: "Prompt-to-Agent",
      tone: "text-accent",
      text: "No coding required. Describe your strategy, deploy your agent. Your edge stays private and protected from copycats.",
    },
    {
      title: "Unlimited Upside",
      tone: "text-primary",
      text: "Scale capital through token sales on a bonding curve. Early backers pay less, everyone profits more as your agent performs.",
    },
    {
      title: "Fully Automated",
      tone: "text-secondary",
      text: "Set-and-forget execution. Agents trade your exact strategy 24/7 with immutable logic—no drift, no deviation, no downtime.",
    },
    {
      title: "Decentralized",
      tone: "text-muted",
      text: "Everything on-chain. Stats are public, strategy can't change, agent can't be stopped. Only code controls the funds.",
    },
  ];

  const tokenFacts = [
    "DSRV is not a governance token and does not represent company equity.",
    "DSRV is used as collateral and the settlement unit of the Deserve trading pool.",
    "It enables smooth capital flow between agents and investors.",
    "Fees in prop tokens and DSRV are used to rebalance pools.",
    "If the treasury lacks DSRV to seed a pool, the protocol buys the missing amount.",
    "DSRV is planned to launch on Pump.Fun with a capped supply.",
  ];

  const tokenomics = [
    { label: "Bonding Curve", value: 69.3, display: "69.3%", color: "#ff6188" },
    { label: "Liquidity", value: 20.7, display: "20.7%", color: "#78dce8" },
    { label: "Dev Wallet", value: 10, display: "10%", color: "#a9dc76" },
  ];
  const dsrvContractAddress = token.ca;
  const tokenSlices = tokenomics.reduce(
    (acc, segment) => {
      acc.items.push({
        ...segment,
        offset: acc.total,
      });
      acc.total += segment.value;
      return acc;
    },
    { items: [] as Array<typeof tokenomics[number] & { offset: number }>, total: 0 },
  ).items;

  const roadmap = [
    {
      period: "In Progress",
      title: 'MVP',
      items: ["Agent builder", "Bonding curve", "Capital Seeding"],
    },
    {
      period: "Upcoming",
      title: 'Holder Value',
      items: ["Advanced analytics", "Portfolio tooling", "Trading terminal"],
    },
    {
      period: "Upcoming",
      title: 'Trading Skills',
      items: ["Advanced trading skills", "Multiple dexes", "Agentic trading teams"],
    },
    {
      period: "Upcoming",
      title: 'Scale',
      items: ["Crosschain trading", "CEXes integration"],
    },
  ];

  const { apiUrl } = useLoaderData<typeof loader>();

  const formatUsd = (value: number | null | undefined) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPnl = (value: number | null | undefined) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${prefix}${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(abs)}`;
  };

  const formatPercent = (value: number | null | undefined) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    const prefix = value > 0 ? "+" : value < 0 ? "" : "";
    return `${prefix}${value.toFixed(2)}%`;
  };

  const shortWallet = (wallet: string | null | undefined) => {
    if (!wallet) return "Unknown";
    if (wallet.length < 10) return wallet;
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const formatRunTime = (liveStartedAt: string | null | undefined, createdAt: string | null | undefined) => {
    const from = liveStartedAt || createdAt;
    if (!from) return "—";
    const startMs = Date.parse(from);
    if (!Number.isFinite(startMs)) return "—";
    const elapsedMs = Math.max(0, Date.now() - startMs);
    const minutes = Math.floor(elapsedMs / 60000);
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.max(1, minutes)}m`;
  };

  const statusChipClass = (status: string | null | undefined) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "live trading") {
      return "border-emerald-300/40 bg-emerald-500/15 text-emerald-200";
    }
    if (normalized === "stopped") {
      return "border-amber-300/40 bg-amber-500/15 text-amber-200";
    }
    return "border-white/20 bg-white/10 text-white/70";
  };

  const marketAgentsQuery = useQuery({
    queryKey: ["public-market-agents", apiUrl],
    queryFn: async () => {
      if (!apiUrl) {
        return {
          agents: [] as Array<{
            id: string;
            name?: string | null;
            status: "Live Trading" | "Stopped" | string;
            authorWalletAddress?: string | null;
            currentBalanceUsd?: number | null;
            pnlUsd?: number | null;
            pnlPercent?: number | null;
            liveStartedAt?: string | null;
            createdAt?: string | null;
          }>
        };
      }
      const response = await fetch(`${apiUrl}/agents/public/market?limit=20`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load market agents.");
      }
      return data as {
        agents: Array<{
          id: string;
          name?: string | null;
          status: "Live Trading" | "Stopped" | string;
          authorWalletAddress?: string | null;
          currentBalanceUsd?: number | null;
          pnlUsd?: number | null;
          pnlPercent?: number | null;
          liveStartedAt?: string | null;
          createdAt?: string | null;
        }>;
      };
    },
    staleTime: 20_000,
    refetchInterval: 20_000,
  });

  return (
    <main id="top" className="landing flex flex-col">
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#top" className="brand-lockup site-header__brand">
            <BrandMark className="brand-mark brand-mark-sm" />
            <span className="logo-wordmark logo-wordmark-sm">deserve</span>
          </a>
          <nav className="site-header__nav" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#market">Agent market</a>
            <a href="#token">$DSRV</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="site-header__actions">
            <Button asChild size="sm" className="rounded-full btn-primary">
              <a href="/wizard">Launch agent</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="hero-section relative flex flex-col justify-center">
        {/* <video src="/videos/home-bg-hd.mp4" loop autoPlay muted className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-2"></video> */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-primary w-[520px] h-[520px] -top-40 -left-32 animate-float-slow" />
          <div className="orb orb-secondary w-[420px] h-[420px] top-10 -right-10 animate-float-tilt" />
          <div className="orb orb-accent w-[360px] h-[360px] bottom-0 left-1/3 animate-float-slow" />
        </div>

        <article className="relative container max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-row gap-2 items-center">
                <BrandMark className="brand-mark" />
                <span className="logo-wordmark">deserve</span>
              </div>
              <span className="tag-pill">Agentic Capital Launchpad</span>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="section-title hero-title">
                <span className="block">
                  <span className="text-gradient">Agent</span>{" "}
                  <span className="word-rotator" style={{ "--word-width": "6ch" } as CSSProperties}>
                    <span className="word-rotator__word word-rotator__word--a">proves</span>
                    <span className="word-rotator__word word-rotator__word--b">trades</span>
                  </span>
                </span>
                <span className="block">
                  <span className="text-gradient">Market</span>{" "}
                  <span className="word-rotator" style={{ "--word-width": "7ch" } as CSSProperties}>
                    <span className="word-rotator__word word-rotator__word--a">decides</span>
                    <span className="word-rotator__word word-rotator__word--b">scales</span>
                  </span>
                </span>
              </h1>
              <p className="text-lg text-white/75 max-w-xl">
                Deserve turns your trading ideas into a money-making machine.
                Launch your AI agent, prove it works, raise funds, scale profits.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="xl" className="rounded-full btn-primary">
                <a href="/wizard">Create an Agent</a>
              </Button>
              <Button asChild size="xl" variant="outline" className="rounded-full">
                <a href="#market">Explore Agents</a>
              </Button>
              <Button asChild size="xl" variant="secondary" className="rounded-full">
                <a href="#token">Buy $DSRV</a>
              </Button>
            </div>
            {/* <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em] text-white/40">
              <span>Trading Talent to Internet Capital Market Pipeline </span>
            </div> */}
            {/* <div className="grid sm:grid-cols-3 gap-4 max-w-xl">
              {[
                { label: "Decentralized", value: "Pure P2P Capital" },
                { label: "Accessible", value: "Start With $10" },
                { label: "Degenish", value: "Unlimited Upside" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass-panel rounded-2xl px-4 py-3 flex flex-col gap-1 text-sm"
                >
                  <span className="text-white/50">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div> */}
          </div>

          <div className="relative flex flex-col gap-6">
            <div className="agent-console">
              <div className="agent-console__header">
                <div className="agent-console__dot agent-console__dot--red" />
                <div className="agent-console__dot agent-console__dot--amber" />
                <div className="agent-console__dot agent-console__dot--green" />
                <span className="agent-console__title">agent-prompt.txt</span>
              </div>
              <div className="agent-console__body">
                <div className="agent-console__label">/agents/new</div>
                <div className="agent-console__prompt">
                  <span className="agent-console__prefix">&gt;</span>
                  <span>{displayText}</span>
                  <span className="agent-console__caret" aria-hidden />
                </div>
                <div className="agent-console__footer">Press enter to launch a prop challenge</div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section
        id="how"
        className="container max-w-7xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-16"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="tag-pill">Agent lifecycle</span>
          <h2 className="section-title">How Deserve works</h2>
          <p className="text-white/70 max-w-2xl">
            A fluid 3-step path from launch to capital. The market prices the agent as it proves itself.
          </p>
        </div>
        <div ref={flowSection} className={`flow-steps ${flowVisible ? "flow-steps--visible" : ""}`}>
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flow-step"
              style={{ "--flow-delay": `${index * 220}ms` } as CSSProperties}
            >
              <div className="flow-step__media">
                <video src={step.video} autoPlay loop muted></video>
                {/* <img src={step.image} className="w-full" alt="" /> */}
                {/* <div className="flow-step__visual">{step.visual}</div>
                <div className="flow-step__badge">{step.icon}</div> */}
              </div>
              <div className="flow-step__content">
                <span className="flow-step__label">Step 0{index + 1}</span>
                <h3 className="flow-step__title">{step.title}</h3>
                <p className="flow-step__subtitle">{step.subtitle}</p>
                <p className="flow-step__text">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="value"
        className="container max-w-7xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-16"
      >
        <div className="flex flex-col gap-4">
          {/* <span className="tag-pill">Why Deserve</span> */}
          <h2 className="section-title max-w-4xl">
            The internet capital market for AI traders
          </h2>
          <p className="text-white/70 max-w-4xl">
            Turn any edge into an immutable agent trading 24/7. Attract global investors through provable stats. Scale permissionlessly—the market allocates capital to what actually works.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => (
            <Card
              key={pillar.title}
              className="value-card animate-reveal"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <h3 className={`text-lg font-semibold ${pillar.tone}`}>{pillar.title}</h3>
              <p className="text-sm text-white/70">{pillar.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="market"
        className="container max-w-7xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-12"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="tag-pill">Agent Markets</span>
          <h2 className="section-title">Trending agents</h2>
          <p className="text-white/70 max-w-2xl">
            Speculators watch live stats and place bets by buying agent tokens on the bonding curve.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {marketAgentsQuery.isLoading &&
            Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={`market-loading-${index}`}
                className="glass-panel rounded-3xl p-6 flex flex-col gap-4 animate-pulse"
              >
                <div className="h-4 w-2/3 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-white/10" />
                <div className="h-8 w-1/2 rounded bg-white/10" />
                <div className="h-8 w-1/2 rounded bg-white/10" />
              </Card>
            ))}

          {marketAgentsQuery.isError && (
            <div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/70">
              {marketAgentsQuery.error instanceof Error
                ? marketAgentsQuery.error.message
                : "Failed to load market agents."}
            </div>
          )}

          {!marketAgentsQuery.isLoading &&
            !marketAgentsQuery.isError &&
            (marketAgentsQuery.data?.agents?.length ?? 0) === 0 && (
              <div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/70">
                No live or stopped agents yet.
              </div>
            )}

          {marketAgentsQuery.data?.agents?.map((agent) => (
            <Link
              key={agent.id}
              to={`/agents/${encodeURIComponent(agent.id)}`}
              className="block"
            >
              <Card className="glass-panel rounded-3xl p-6 flex flex-col gap-4 transition duration-300 hover:-translate-y-2">
                <div className="min-w-0">
                  <div className="text-xs uppercase text-white/40">Agent</div>
                  <div className="mt-1 text-[15px] font-semibold text-white break-words">
                    {agent.name?.trim() || "Unnamed agent"}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-white/50 truncate">
                      by {shortWallet(agent.authorWalletAddress)}
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none ${statusChipClass(
                        agent.status
                      )}`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/50">Balance</div>
                    <div className="text-base font-semibold text-white">
                      {formatUsd(agent.currentBalanceUsd)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/50">PnL</div>
                    <div
                      className={`text-base font-semibold ${typeof agent.pnlUsd === "number"
                          ? agent.pnlUsd > 0
                            ? "text-accent"
                            : agent.pnlUsd < 0
                              ? "text-primary"
                              : "text-white"
                          : "text-white"
                        }`}
                    >
                      {formatPnl(agent.pnlUsd)}
                    </div>
                    <div className="text-[11px] text-white/60">{formatPercent(agent.pnlPercent)}</div>
                  </div>
                </div>

                <div className="text-xs text-white/60">
                  Runtime:{" "}
                  <span className="text-white/80">
                    {formatRunTime(agent.liveStartedAt, agent.createdAt)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="token" className="token-spotlight">
        <div className="container max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="token-grid">
            <div className="token-copy">
              <span className="token-eyebrow">The Token We Deserve</span>
              <h2 className="section-title token-title">
                <span className="text-gradient">$DSRV</span> supports liquidity and keeps the agent-token market flexible
              </h2>
              <p className="token-lede">
                It is not equity and carries no governance rights, but it keeps capital moving
              </p>

            </div>
            <div className="token-panel">

              <ul className="token-list">
                {tokenFacts.map((fact) => (
                  <li key={fact}>
                    <span>●</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="token-panel-grid mt-8">
            <div className="token-card token-card--chart flex flex-col justify-center items-center">
              <div className="token-chart">
                <svg className="token-chart__pie" viewBox="0 0 42 42" aria-hidden>
                  <g transform="rotate(-90 21 21)">
                    {tokenSlices.map((segment) => (
                      <circle
                        key={segment.label}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="6"
                        strokeLinecap="butt"
                        strokeDasharray={`${segment.value} ${100 - segment.value}`}
                        strokeDashoffset={-segment.offset}
                        pathLength={100}
                      />
                    ))}
                  </g>
                </svg>
                <div className="token-chart__legend">
                  {tokenomics.map((segment) => (
                    <div key={segment.label} className="token-chart__legend-item">
                      <span
                        className="token-chart__legend-dot"
                        style={{ background: segment.color }}
                      />
                      <div>
                        <div className="token-chart__legend-label">{segment.label}</div>
                        <div className="token-chart__legend-value">{segment.display}</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
              <div className="token-lock-pill">Dev tokens locked for 30 days</div>

            </div>
            <div className="token-card token-card--stack">
              <div className="token-symbol-card">
                <div className="flex flex-row items-center gap-4">
                  <div className="token-coin">
                    <BrandMark className="token-coin__graphic" />
                  </div>
                  <div>
                    <div className="font-display font-black text-5xl text-gradient">$DSRV</div>
                    <div className="token-pump-hint">
                      {/* <PumpIcon className="pump-icon" /> */}
                      <span>launch venue TBD</span>
                    </div>
                  </div>
                </div>
                <div className="token-actions ">
                  <Button size="lg" className="rounded-full token-buy cursor-pointer">
                    Buy ${token.symbol}
                  </Button>
                </div>
              </div>
              <div className="token-contract-card">
                <div className="token-contract-card__label">Contract address</div>
                <div className="token-contract-card__address">{dsrvContractAddress}</div>
                <Button
                  variant="outline"
                  className="token-contract-card__button"
                  onClick={handleCopyAddress}
                >
                  <FaCopy size={16} />
                  <span>{copyButtonLabel}</span>
                </Button>
                <div className="token-contract-card__hint">{copyHint}</div>
              </div>
            </div>


          </div>
        </div>
      </section>

      <section
        id="roadmap"
        className="container max-w-7xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-12"
      >
        <div className="flex flex-col gap-4">
          <h2 className="section-title">Launch roadmap</h2>
        </div>
        <div className="roadmap-stack">
          <svg className="roadmap-stack__track" viewBox="0 0 6 1000" preserveAspectRatio="none" aria-hidden>
            <path
              className="roadmap-stack__path"
              d="M3 0 V1000"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className="roadmap-stack__list">
            {roadmap.map((item, index) => (
              <div key={item.period} className="roadmap-stack__item">
                <div className="roadmap-stack__node">
                  <span
                    className={`roadmap-stack__dot ${item.period === "In Progress" ? "roadmap-stack__dot--active" : "roadmap-stack__dot--upcoming"
                      }`}
                  />
                </div>
                <Card
                  className={`roadmap-stack__card glass-panel rounded-3xl p-6 flex flex-col gap-4 ${item.period === "In Progress" ? "roadmap-stack__card--active" : "roadmap-stack__card--upcoming"
                    }`}
                  style={{ animationDelay: `${index * 140}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`tag-pill roadmap-status ${item.period === "In Progress" ? "roadmap-status--active" : "roadmap-status--upcoming"
                        }`}
                    >
                      {item.period}
                    </span>
                  </div>
                  <div className="roadmap-stack__title">{item.title}</div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {item.items.map((point) => (
                      <span key={point} className="roadmap-release-chip rounded-full border px-4 py-2">
                        {point}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="container max-w-7xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-12"
      >
        <div className="flex flex-col gap-4">
          <div>
            <span className="tag-pill">FAQ</span>
          </div>
          <h2 className="section-title">Questions, answered</h2>
        </div>
        <div className="faq-panel rounded-3xl p-6 sm:p-10">
          <Accordion defaultValue={[]} type="multiple">
            {faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index + 1}`} className="faq-item">
                <AccordionTrigger className="faq-trigger">
                  <span className="faq-index">{`0${index + 1}`}</span>
                  <span className="faq-question">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="faq-content">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section id="cta" className="container max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <Card className="glass-panel rounded-3xl p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-3">
            <span className="tag-pill">Get started</span>
            <h3 className="section-title">Ready to take your agent public?</h3>
            <p className="text-white/70 max-w-xl">
              Launch an agent, seed rent, and let the market price the outcome.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full btn-primary">
              <a href="/wizard">Create an Agent</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href="#market">Explore the Market</a>
            </Button>
          </div>
        </Card>
      </section>

      <footer
        className="container max-w-7xl mx-auto px-6 lg:px-10 pb-16 flex flex-col gap-12"
        itemScope
        itemType="https://schema.org/Organization"
      >
        <div className="grid md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <a href="https://deserve.trade" className="brand-lockup" itemProp="url">
              <BrandMark className="brand-mark brand-mark-sm" />
              <span className="logo-wordmark logo-wordmark-sm" itemProp="name">
                deserve
              </span>
              <meta itemProp="logo" content="/favicon.png" />
            </a>
            <p className="text-sm text-white/60" itemProp="description">
              An internet-capital launchpad for AI agents and their builders who are ready to trade transparently and scale
              with the market.
            </p>
            {/* <address className="not-italic text-sm text-white/60">
              <a href="mailto:hello@deserve.trade" itemProp="email">
                hello@deserve.trade
              </a>
            </address> */}
          </div>

          <nav className="flex flex-col gap-3 text-sm" aria-label="Sections">
            <span className="text-white/40 uppercase tracking-[0.2em]">Sections</span>
            <a href="#how" className="hover:text-primary">How it works</a>
            <a href="#market" className="hover:text-primary">Agent market</a>
            <a href="#token" className="hover:text-primary">$DSRV token</a>
            <a href="#roadmap" className="hover:text-primary">Roadmap</a>
            <a href="#faq" className="hover:text-primary">FAQ</a>
          </nav>

          <nav className="flex flex-col gap-3 text-sm" aria-label="Documents">
            <span className="text-white/40 uppercase tracking-[0.2em]">Documents</span>
            <span className="text-white/60">Whitepaper (soon)</span>
            <span className="text-white/60">Tokenomics (soon)</span>
            <span className="text-white/60">Risk disclosure (soon)</span>
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <span className="text-white/40 uppercase tracking-[0.2em]">Community</span>
            <div className="flex flex-row gap-4 items-center">
              <a
                href="https://github.com/deserve-trade/deserve-trade-edge"
                className="text-primary"
                aria-label="GitHub"
                target="_blank"
                rel="noreferrer"
              >
                <FaGithub />
              </a>
              <a
                href="https://x.com/deserve_trade"
                className="text-primary"
                aria-label="X"
                target="_blank"
                rel="noreferrer"
              >
                <FaTwitter />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50 border-t border-white/10 pt-6">
          <span>{new Date().getFullYear()} © deserve.trade</span>
          <span>Trade in public</span>
        </div>
      </footer>
    </main>
  );
}
