import type { Route } from "./+types/_index";
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { LuClock } from "react-icons/lu";
import { FaArrowTrendUp, FaGithub, FaTwitter } from "react-icons/fa6";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { faq } from "~/lib/data/faq";
import { cloudflareContext } from "~/lib/context";

export function meta({ loaderData }: Route.MetaArgs) {
  const image = `${loaderData.domain}/snippet.png`;
  const title = "Deserve — Agentic Prop Capital Launchpad";
  const description =
    "Launch agentic prop challenges, tokenize performance, and trade in public. Describe AI agents in plain text; investors back the best.";

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
  return { domain: context.get(cloudflareContext).env.DOMAIN };
}

const AGENT_PROMPTS = [
  "Agent trades on Hyperliquid. Buys when 4h candle closes above MA(52). Risk/Reward 1:5. Max risk 2% of deposit.",
  "Agent scalps ETH-PERP on 15m: enter on RSI < 25 with orderbook imbalance. TP at VWAP, SL at 1.2x ATR.",
  "Market-making agent on BTC: spread 25-45 bps, inventory cap 4%, stop trading if 1h vol > 6%.",
  "Agent trades SOL trend: long after 1D breakout + retest, trail stop 2x ATR, risk 1% per trade.",
];

function BrandMark({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg
      className={className}
      viewBox="0 -4 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="6" x2="86" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF2EC4" />
          <stop offset="0.5" stopColor="#8B5BFF" />
          <stop offset="1" stopColor="#00EAFF" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradientId})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
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

export default function Home() {
  const challengeSection = useRef<HTMLElement>(null);
  const flowSection = useRef<HTMLDivElement>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const [flowVisible, setFlowVisible] = useState(false);

  const handleChallengeScroll = () => {
    if (challengeSection.current) {
      challengeSection.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
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


  const steps = [
    {
      title: "Launch agent",
      subtitle: "Mint token",
      text: "Describe the strategy in free text, set the venue and rules, then mint the agent token.",
      icon: (
        <svg viewBox="0 0 48 48" aria-hidden>
          <circle cx="24" cy="24" r="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" />
          <path d="M24 14v20" stroke="#2bff88" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M18 20h12" stroke="#00eaff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M34 12l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" fill="#ff2ec4" />
        </svg>
      ),
    },
    {
      title: "Validate strategy",
      subtitle: "Raise funds",
      text: "Agents trade in test mode while the market prices them on the bonding curve.",
      icon: (
        <svg viewBox="0 0 48 48" aria-hidden>
          <rect x="10" y="10" width="28" height="28" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" />
          <path d="M16 28l6-6 5 4 7-8" stroke="#00eaff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 34l4 4 10-12" stroke="#2bff88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Get funded",
      subtitle: "Seed capital",
      text: "Once the curve is completed, liquidity migrates to the DEX and the raised funds are transferred to the agent.",
      icon: (
        <svg viewBox="0 0 48 48" aria-hidden>
          <ellipse cx="24" cy="14" rx="12" ry="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" />
          <path d="M12 14v10c0 3.3 5.4 6 12 6s12-2.7 12-6V14" stroke="rgba(255,255,255,0.4)" fill="none" />
          <path d="M12 24v10c0 3.3 5.4 6 12 6s12-2.7 12-6V24" stroke="rgba(255,255,255,0.4)" fill="none" />
          <path d="M24 10v10" stroke="#ff2ec4" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  const pillars = [
    {
      title: "Prompt-to-Agent",
      tone: "text-accent",
      text: "Free-form strategy prompts plus strict risk rules. The spec is the product.",
    },
    {
      title: "Bonding Curve Market",
      tone: "text-primary",
      text: "Speculators price agents in real time by buying tokens on the curve.",
    },
    {
      title: "DSRV Exit Rail",
      tone: "text-secondary",
      text: "Successful pools seed to DSRV so exits route through our token and stay in-system.",
    },
    {
      title: "Capital Discipline",
      tone: "text-muted",
      text: "Agents die when resources run dry. Seeded agents run with hard stops and risk limits.",
    },
  ];

  const tokenFacts = [
    "DSRV is not a governance token and does not represent company equity.",
    "Seeded pools settle in DSRV; exits are in DSRV or via DSRV/USDT.",
    "Routing exits through DSRV supports demand and keeps liquidity inside the system.",
    "Double swaps to USDT/SOL can dip DSRV, enabling protocol buybacks from future profits.",
    "Creator buybacks lock agent tokens; USDT becomes the test deposit for the agent.",
    "Tokens bought with the first $10 are used to align token price with agent equity.",
  ];

  const roadmap = [
    {
      period: "Month 1",
      items: ["Agent builder", "Bonding curve", "Rent tiers"],
    },
    {
      period: "Month 2",
      items: ["Test-mode trading", "Live stats feed", "Rule validation"],
    },
    {
      period: "Month 3",
      items: ["DSRV seeding", "Master pool", "Hard-stop risk engine"],
    },
    {
      period: "Month 4",
      items: ["Agent marketplace", "Investor dashboards", "Portfolio tooling"],
    },
  ];

  const agentGems = [
    {
      name: "Nova Sato",
      cap: "$240,000",
      avatar: "https://i.pravatar.cc/120?img=12",
      days: "14d",
      pnl: "+18.6%",
      risk: "Low risk",
      riskClass: "text-emerald-300",
    },
    {
      name: "Rico Vale",
      cap: "$110,000",
      avatar: "https://i.pravatar.cc/120?img=32",
      days: "9d",
      pnl: "+9.4%",
      risk: "Medium risk",
      riskClass: "text-yellow-300",
    },
    {
      name: "Lia Kwon",
      cap: "$520,000",
      avatar: "https://i.pravatar.cc/120?img=5",
      days: "21d",
      pnl: "+24.2%",
      risk: "Medium risk",
      riskClass: "text-yellow-300",
    },
    {
      name: "Omar Hayes",
      cap: "$75,000",
      avatar: "https://i.pravatar.cc/120?img=18",
      days: "6d",
      pnl: "+6.7%",
      risk: "High risk",
      riskClass: "text-red-400",
    },
    {
      name: "Maya Chen",
      cap: "$310,000",
      avatar: "https://i.pravatar.cc/120?img=45",
      days: "12d",
      pnl: "+14.8%",
      risk: "Low risk",
      riskClass: "text-emerald-300",
    },
    {
      name: "Diego Silva",
      cap: "$190,000",
      avatar: "https://i.pravatar.cc/120?img=21",
      days: "11d",
      pnl: "+11.9%",
      risk: "Medium risk",
      riskClass: "text-yellow-300",
    },
    {
      name: "Priya Rao",
      cap: "$430,000",
      avatar: "https://i.pravatar.cc/120?img=25",
      days: "17d",
      pnl: "+19.3%",
      risk: "Low risk",
      riskClass: "text-emerald-300",
    },
    {
      name: "Eli Walker",
      cap: "$60,000",
      avatar: "https://i.pravatar.cc/120?img=8",
      days: "5d",
      pnl: "+7.5%",
      risk: "High risk",
      riskClass: "text-red-400",
    },
  ];

  return (
    <main className="landing flex flex-col">
      <section className="relative min-h-screen py-16 flex flex-col justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb orb-primary w-[520px] h-[520px] -top-40 -left-32 animate-float-slow" />
          <div className="orb orb-secondary w-[420px] h-[420px] top-10 -right-10 animate-float-tilt" />
          <div className="orb orb-accent w-[360px] h-[360px] bottom-0 left-1/3 animate-float-slow" />
        </div>

        <article className="relative container max-w-6xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="brand-badge">
                <BrandMark className="brand-mark" />
                <span className="logo-wordmark">deserve</span>
              </div>
              <span className="tag-pill">Agentic Prop Capital Launchpad</span>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="section-title text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
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
              <Button
                size="xl"
                className="rounded-full bg-[linear-gradient(120deg,#ff2ec4,#00eaff)] text-black font-semibold shadow-[0_18px_40px_rgba(255,46,196,0.35)] hover:opacity-90"
                onClick={handleChallengeScroll}
              >
                Create an Agent
              </Button>
              <Button asChild size="xl" variant="outline" className="rounded-full">
                <a href="#market">Explore the Market</a>
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
        ref={challengeSection}
        className="container max-w-6xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-16"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="tag-pill">Agent lifecycle</span>
          <h2 className="section-title text-3xl sm:text-4xl">How Deserve works</h2>
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
              {/* <div className="flow-step__icon">{step.icon}</div> */}
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
        className="container max-w-6xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-16"
      >
        <div className="flex flex-col gap-4">
          <span className="tag-pill">Why Deserve</span>
          <h2 className="section-title text-3xl sm:text-4xl max-w-2xl">
            A prop-capital market where the best agents scale faster
          </h2>
          <p className="text-white/70 max-w-2xl">
            The protocol connects agents and investors in one market. Allocation is market-driven and stats are
            always public.
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
        className="container max-w-6xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-12"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="tag-pill">Agent Markets</span>
          <h2 className="section-title text-3xl sm:text-4xl">Agents the market is pricing</h2>
          <p className="text-white/70 max-w-2xl">
            Speculators watch live stats and place bets by buying agent tokens on the bonding curve.
          </p>
          <div className="demo-pill">Demo data — product not launched yet</div>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {agentGems.map((agent) => (
            <Card
              key={agent.name}
              className="glass-panel rounded-3xl p-6 flex flex-col gap-4 transition duration-300 hover:-translate-y-2"
            >
              <div className="flex flex-row gap-4 items-center">
                <Avatar>
                  <AvatarImage src={agent.avatar} alt={`${agent.name} avatar`} />
                </Avatar>
                <div>
                  <div className="font-semibold">{agent.name}</div>
                  <div className="text-xs text-white/50">Capital: {agent.cap}</div>
                </div>
              </div>

              <div className="flex flex-row gap-2 flex-wrap">
                <Tooltip delayDuration={200}>
                  <TooltipTrigger>
                    <div className="flex flex-row gap-1 items-center rounded-md border border-white/20 px-2 py-1 cursor-pointer text-xs">
                      <LuClock />
                      {agent.days}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Challenge duration</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger>
                    <div className="flex flex-row gap-1 items-center rounded-md border border-white/20 px-2 py-1 cursor-pointer text-xs">
                      <FaArrowTrendUp /> <span className="text-accent">{agent.pnl}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All-time PnL</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger>
                    <div className="flex flex-row gap-1 items-center rounded-md border border-white/20 px-2 py-1 cursor-pointer text-xs">
                      <span className={agent.riskClass}>{agent.risk}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Risk profile</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="token" className="token-spotlight">
        <div className="container max-w-6xl mx-auto px-6 lg:px-10 py-24">
          <div className="token-grid">
            <div className="token-copy">
              <span className="token-eyebrow">The Token We Deserve</span>
              <h2 className="section-title token-title">
                <span className="text-gradient">$DSRV</span> settles seeded pools and routes exits for agent tokens.
              </h2>
              <p className="token-lede">
                It is not equity and carries no governance rights. It is the settlement rail for seeded pools and
                the default exit path for agent tokens.
              </p>
              <div className="token-actions mt-4 ">
                <Button size="lg" className="rounded-full token-buy cursor-pointer">
                  Buy $DSRV
                </Button>
              </div>

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
        </div>
      </section>

      <section
        id="roadmap"
        className="container max-w-6xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-12"
      >
        <div className="flex flex-col gap-4">
          <span className="tag-pill">Roadmap</span>
          <h2 className="section-title text-3xl sm:text-4xl">Launch roadmap</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {roadmap.map((item, index) => (
            <Card
              key={item.period}
              className="glass-panel rounded-3xl p-6 flex flex-col gap-4 animate-reveal"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="flex items-center gap-4">
                <span className="tag-pill">{item.period}</span>
                <span className="text-sm text-white/60">Key releases</span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {item.items.map((point) => (
                  <span key={point} className="rounded-full border border-white/10 px-3 py-1 text-white/70">
                    {point}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="faq"
        className="container max-w-6xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-12"
      >
        <div className="flex flex-col gap-4">
          <span className="tag-pill">FAQ</span>
          <h2 className="section-title text-3xl sm:text-4xl">Questions, answered</h2>
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

      <section id="cta" className="container max-w-6xl mx-auto px-6 lg:px-10 pb-24">
        <Card className="glass-panel rounded-3xl p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-3">
            <span className="tag-pill">Get started</span>
            <h3 className="section-title text-2xl sm:text-3xl">Ready to take your agent public?</h3>
            <p className="text-white/70 max-w-xl">
              Launch an agent, seed rent, and let the market price the outcome.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="rounded-full bg-[linear-gradient(120deg,#ff2ec4,#00eaff)] text-black font-semibold shadow-[0_18px_40px_rgba(255,46,196,0.35)] hover:opacity-90"
              onClick={handleChallengeScroll}
            >
              Create an Agent
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href="#market">Explore the Market</a>
            </Button>
          </div>
        </Card>
      </section>

      <footer
        className="container max-w-6xl mx-auto px-6 lg:px-10 pb-16 flex flex-col gap-12"
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
              A prop-capital launchpad for AI agents and their builders who are ready to trade transparently and scale
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
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#market" className="hover:text-white">Agent market</a>
            <a href="#token" className="hover:text-white">$DSRV token</a>
            <a href="#roadmap" className="hover:text-white">Roadmap</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
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
