# Deserve — Prop Capital Launchpad

Deserve is a landing page for a prop-capital market where traders launch challenges, tokenize performance, and let the market allocate capital. The experience is designed around transparent stats, public challenges, and a tokenized path to scaling trading capital.

## Product Snapshot
- Launch a challenge with clear rules, goals, risk limits, and duration.
- Trade transparently with public stats, PnL, and risk metrics.
- Scale capital as profits buy back trader tokens from the market.

## Landing Page Structure
- Hero with the core message, CTAs, and live-style challenge snapshots.
- How it works section with the 3-step flow.
- Why Deserve value pillars: Trader Personality, Tokenized Capital, Prop Capital Market, Community Driven.
- Trading Gems grid with demo trader cards and risk profiles.
- $DSRV token spotlight and core token facts.
- Roadmap with monthly milestones.
- FAQ and final CTA.

## $DSRV Token (Landing Copy)
- Not equity and no governance rights.
- Collateral and settlement unit of the trading pool.
- Facilitates capital flow between traders and investors.
- Fees in prop tokens and DSRV rebalance pools.
- Protocol buys DSRV if treasury is short when seeding pools.
- Planned launch on Pump.Fun with capped supply.

## Status
This is a marketing landing page. The Trading Gems data is demo-only and the product is not launched yet.

## Tech Stack
- React Router 7
- Vite
- Cloudflare Workers (Wrangler)
- Tailwind CSS

## Local Development
1. Install dependencies.
   ```bash
   npm install
   ```
2. Start the dev server.
   ```bash
   npm run dev
   ```
3. Open the app at `http://localhost:5173`.

## Environment & Secrets
- Local development uses `.dev.vars`.
- Use `.dev.vars.example` as a template.
- Production secrets should be stored with `wrangler secret put`.

## Build & Deploy
1. Build for production.
   ```bash
   npm run build
   ```
2. Deploy to Cloudflare.
   ```bash
   npm run deploy
   ```

The deploy script uses `scripts/build-prod.mjs` to avoid embedding `.dev.vars` into the production build output.
