export const faq = [
  {
    question: "What is a challenge and how do I start one?",
    answer:
      "Create a trader token, link your account to our pool, and pay a $10 launch fee.",
  },
  {
    question: "Can I buy back my own tokens at launch?",
    answer:
      "Yes. You can buy on the bonding curve, but tokens stay locked until seeding. More buyback means lower early investor risk.",
  },
  {
    question: "How is performance tracked?",
    answer:
      "We publish live stats and risk metrics from your linked trading account.",
  },
  {
    question: "How do investors participate?",
    answer:
      "They buy trader tokens based on public stats, priced by the bonding curve.",
  },
  {
    question: "What happens if the challenge fails before the pool is seeded?",
    answer:
      "Trader tokens burn. Investors exit on the bonding curve, discouraging immediate dumps.",
  },
  {
    question: "What happens when the challenge is successful?",
    answer:
      "The pool is seeded to DSRV. Exits are via DSRV or DSRV/USDT, keeping liquidity inside the system.",
  },
  {
    question: "Why route exits through DSRV?",
    answer:
      "It supports DSRV demand and enables buybacks on dips using future profits.",
  },
  {
    question: "What happens after the pool is seeded?",
    answer:
      "Funds move to the master pool and we copy-trade with strict risk limits.",
  },
  {
    question: "What if a trader breaks challenge rules after seeding?",
    answer:
      "We lock trader tokens, remove liquidity, pull funds, move DSRV to treasury, and return remaining assets to the bonding curve. Investors decide next steps.",
  },
  {
    question: "How are imbalances between pool size and token price handled?",
    answer:
      "We rebalance via the master pool when inflows or exits create mismatches.",
  },
];
