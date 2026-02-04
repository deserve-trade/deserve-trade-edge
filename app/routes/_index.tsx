import type { Route } from "./+types/_index";
import { useId, useRef } from "react";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { LuClock } from "react-icons/lu";
import { FaArrowTrendUp, FaDiscord, FaEnvelope, FaGithub, FaTwitter } from "react-icons/fa6";
import { VscError } from "react-icons/vsc";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { faq } from "~/lib/data/faq";
import { cloudflareContext } from "~/lib/context";
import { keyRequired } from "~/lib/middleware/key-required";

export function meta({ loaderData }: Route.MetaArgs) {
  const image = `${loaderData.domain}/snippet.png`;
  const title = "Deserve — Prop Capital Launchpad";
  const description =
    "Launch a prop challenge, tokenize performance, and trade in public. Investors pick the best; buybacks turn profit into capital.";

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
        "Trading, Perps, DEX, Prop Trading, DeFi, Futures, Launchpad, Tokens, Crypto, On-chain, Capital Market",
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

  const handleChallengeScroll = () => {
    if (challengeSection.current) {
      challengeSection.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };


  const steps = [
    {
      title: "Launch a challenge",
      text: "Create a trader token, set goals, risk limits, and duration. The market sees the rules from day one.",
    },
    {
      title: "Trade transparently",
      text: "Stats, PnL, and risk metrics update in public. Investors back the most consistent traders.",
    },
    {
      title: "Scale capital",
      text: "Profits buy back tokens from the market. Price grows while capital stays at work.",
    },
  ];

  const pillars = [
    {
      title: "Trader Personality",
      tone: "text-accent",
      text: "Tune the challenge to your strategy. Trade solo or as a team.",
    },
    {
      title: "Tokenized Capital",
      tone: "text-primary",
      text: "Your token mirrors performance. Even steady gains scale with market demand.",
    },
    {
      title: "Prop Capital Market",
      tone: "text-secondary",
      text: "Investors buy trader tokens while the protocol reallocates capital automatically.",
    },
    {
      title: "Community Driven",
      tone: "text-muted",
      text: "Capital is allocated by the market, not a committee. Less bureaucracy, more speed and transparency.",
    },
  ];

  const tokenFacts = [
    "DSRV is not a governance token and does not represent company equity.",
    "DSRV is used as collateral and the settlement unit of the Deserve trading pool.",
    "It enables smooth capital flow between traders and investors.",
    "Fees in prop tokens and DSRV are used to rebalance pools.",
    "If the treasury lacks DSRV to seed a pool, the protocol buys the missing amount.",
    "DSRV is planned to launch on Pump.Fun with a capped supply.",
  ];

  const roadmap = [
    {
      period: "Month 1",
      items: ["Token launch", "First challenges"],
    },
    {
      period: "Month 2",
      items: ["Prop pools launch", "Prop-capital trading"],
    },
    {
      period: "Month 3",
      items: ["Prop-token staking", "Prop-token marketplace"],
    },
    {
      period: "Month 4",
      items: ["Team prop pools", "Seasonal competitions"],
    },
  ];

  const tradingGems = [
    {
      name: "Nova Sato",
      cap: "$240,000",
      avatar: "https://i.pravatar.cc/120?img=12",
      days: "14d",
      pnl: "+18.6%",
      drawdown: "3.2%",
      risk: "Low risk",
      riskClass: "text-emerald-300",
    },
    {
      name: "Rico Vale",
      cap: "$110,000",
      avatar: "https://i.pravatar.cc/120?img=32",
      days: "9d",
      pnl: "+9.4%",
      drawdown: "6.1%",
      risk: "Medium risk",
      riskClass: "text-yellow-300",
    },
    {
      name: "Lia Kwon",
      cap: "$520,000",
      avatar: "https://i.pravatar.cc/120?img=5",
      days: "21d",
      pnl: "+24.2%",
      drawdown: "4.4%",
      risk: "Medium risk",
      riskClass: "text-yellow-300",
    },
    {
      name: "Omar Hayes",
      cap: "$75,000",
      avatar: "https://i.pravatar.cc/120?img=18",
      days: "6d",
      pnl: "+6.7%",
      drawdown: "8.9%",
      risk: "High risk",
      riskClass: "text-red-400",
    },
    {
      name: "Maya Chen",
      cap: "$310,000",
      avatar: "https://i.pravatar.cc/120?img=45",
      days: "12d",
      pnl: "+14.8%",
      drawdown: "5.0%",
      risk: "Low risk",
      riskClass: "text-emerald-300",
    },
    {
      name: "Diego Silva",
      cap: "$190,000",
      avatar: "https://i.pravatar.cc/120?img=21",
      days: "11d",
      pnl: "+11.9%",
      drawdown: "6.8%",
      risk: "Medium risk",
      riskClass: "text-yellow-300",
    },
    {
      name: "Priya Rao",
      cap: "$430,000",
      avatar: "https://i.pravatar.cc/120?img=25",
      days: "17d",
      pnl: "+19.3%",
      drawdown: "3.9%",
      risk: "Low risk",
      riskClass: "text-emerald-300",
    },
    {
      name: "Eli Walker",
      cap: "$60,000",
      avatar: "https://i.pravatar.cc/120?img=8",
      days: "5d",
      pnl: "+7.5%",
      drawdown: "9.6%",
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
              <span className="tag-pill">Prop Capital Launchpad</span>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="section-title text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
                Do you <span className="text-gradient">deserve</span> to <span className="text-gradient">trade</span>?
                <br />
                Let the <span className="text-gradient">market</span> decide.
              </h1>
              <p className="text-lg text-white/75 max-w-xl">
                Deserve lets traders scale their capital exponentially through tokenized trading strategies.
                Launch a challenge, execute your edge—let the market do the rest.
                {/* Deserve connects skilled traders with capital through transparent, on-chain performance. Complete challenges, publish your track record, and let investors find you—no middlemen. */}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                size="xl"
                className="rounded-full bg-[linear-gradient(120deg,#ff2ec4,#00eaff)] text-black font-semibold shadow-[0_18px_40px_rgba(255,46,196,0.35)] hover:opacity-90"
                onClick={handleChallengeScroll}
              >
                Launch a Challenge
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
            <Card className="glass-panel rounded-3xl p-8 animate-float-slow">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Challenge Snapshot</p>
                    <h3 className="text-2xl font-semibold text-glow">Alpha Trader</h3>
                  </div>
                  <span className="tag-pill">Live</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-white/50">PnL</p>
                    <p className="font-semibold text-accent">+12.4%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-white/50">Drawdown</p>
                    <p className="font-semibold text-primary">4.1%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-white/50">Capital</p>
                    <p className="font-semibold">$150k</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Progress</span>
                    <span>67%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-2/3 rounded-full bg-[linear-gradient(120deg,#2bff88,#00eaff)]" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass-panel rounded-3xl p-8 animate-float-tilt">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/60">Capital Flow</p>
                  <span className="text-xs text-white/40">auto-buyback</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-semibold text-gradient">$2.4M</span>
                  <span className="text-sm text-accent">+18% weekly</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-white/50">Investors</p>
                    <p className="font-semibold">1,284</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-white/50">Active pools</p>
                    <p className="font-semibold">42</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </article>
      </section>

      <section
        id="how"
        ref={challengeSection}
        className="container max-w-6xl mx-auto px-6 lg:px-10 py-24 flex flex-col gap-16"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="tag-pill">Trade in public</span>
          <h2 className="section-title text-3xl sm:text-4xl">How Deserve works</h2>
          <p className="text-white/70 max-w-2xl">
            Three steps to turn your trading stats into capital. The challenge is the product; the market is the
            allocator.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="glass-panel rounded-3xl p-6 flex flex-col gap-4 animate-reveal"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">Step 0{index + 1}</span>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-sm text-white/70">{step.text}</p>
            </Card>
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
            A prop-capital market where the best traders scale faster
          </h2>
          <p className="text-white/70 max-w-2xl">
            The protocol connects traders and investors in one market. Allocation is market-driven and stats are
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
          <span className="tag-pill">Trading Gems</span>
          <h2 className="section-title text-3xl sm:text-4xl">Traders the market is watching</h2>
          <p className="text-white/70 max-w-2xl">
            A live showcase of active challenges. The more consistent the stats, the more capital the market
            provides.
          </p>
          <div className="demo-pill">Demo data — product not launched yet</div>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {tradingGems.map((trader) => (
            <Card
              key={trader.name}
              className="glass-panel rounded-3xl p-6 flex flex-col gap-4 transition duration-300 hover:-translate-y-2"
            >
              <div className="flex flex-row gap-4 items-center">
                <Avatar>
                  <AvatarImage src={trader.avatar} alt={`${trader.name} avatar`} />
                </Avatar>
                <div>
                  <div className="font-semibold">{trader.name}</div>
                  <div className="text-xs text-white/50">Cap: {trader.cap}</div>
                </div>
              </div>

              <div className="flex flex-row gap-2 flex-wrap">
                <Tooltip delayDuration={200}>
                  <TooltipTrigger>
                    <div className="flex flex-row gap-1 items-center rounded-md border border-white/20 px-2 py-1 cursor-pointer text-xs">
                      <LuClock />
                      {trader.days}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Challenge duration</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger>
                    <div className="flex flex-row gap-1 items-center rounded-md border border-white/20 px-2 py-1 cursor-pointer text-xs">
                      <FaArrowTrendUp /> <span className="text-accent">{trader.pnl}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All-time PnL</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger>
                    <div className="flex flex-row gap-1 items-center rounded-md border border-white/20 px-2 py-1 cursor-pointer text-xs">
                      <VscError /> <span className="text-primary">{trader.drawdown}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Max drawdown</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger>
                    <div className="flex flex-row gap-1 items-center rounded-md border border-white/20 px-2 py-1 cursor-pointer text-xs">
                      <span className={trader.riskClass}>{trader.risk}</span>
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
                <span className="text-gradient">$DSRV</span> supports liquidity and keeps the prop-token market flexible.
              </h2>
              <p className="token-lede">
                It is not equity and carries no governance rights, but it keeps capital moving.
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
            <h3 className="section-title text-2xl sm:text-3xl">Ready to take your trading public?</h3>
            <p className="text-white/70 max-w-xl">
              Launch a challenge, mint your token, and get investor attention today.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="rounded-full bg-[linear-gradient(120deg,#ff2ec4,#00eaff)] text-black font-semibold shadow-[0_18px_40px_rgba(255,46,196,0.35)] hover:opacity-90"
              onClick={handleChallengeScroll}
            >
              Launch a Challenge
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
              A prop-capital launchpad for traders who are ready to trade transparently and scale with the market.
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
            <a href="#market" className="hover:text-white">Trader market</a>
            <a href="#token" className="hover:text-white">$DSRV token</a>
            <a href="#roadmap" className="hover:text-white">Roadmap</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>

          <nav className="flex flex-col gap-3 text-sm" aria-label="Documents">
            <span className="text-white/40 uppercase tracking-[0.2em]">Documents</span>
            <a href="#" className="hover:text-white">
              Whitepaper
            </a>
            <a href="#" className="hover:text-white">
              Tokenomics
            </a>
            <a href="#" className="hover:text-white">
              Risk disclosure
            </a>
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <span className="text-white/40 uppercase tracking-[0.2em]">Community</span>
            <div className="flex flex-row gap-4 items-center">
              <a href="https://github.com/shadcn" className="text-primary" aria-label="GitHub">
                <FaGithub />
              </a>
              <a href="https://twitter.com/shadcn" className="text-primary" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://discord.gg/shadcn" className="text-primary" aria-label="Discord">
                <FaDiscord />
              </a>
              <a href="mailto:hello@deserve.trade" className="text-primary" aria-label="Email">
                <FaEnvelope />
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
