export const faq = [
  {
    question: "How do I create an agent?",
    answer:
      "Describe your strategy in free text, set the venue, and define the rules. Mint the agent and its token with public rules.",
  },
  {
    question: "What do I pay to launch?",
    answer:
      "Creators buy their own tokens and pay protocol rent: $10/$20/$50 for 1/2/4 weeks. All bought agent tokens lock; USDT becomes the agent’s test deposit.",
  },
  {
    question: "How does test mode work?",
    answer:
      "The agent trades with the initial capital. Each day, a fixed number of deposit tokens is deducted by the Deserve protocol to cover AI and server costs."
  },
  {
    question: "How is performance tracked?",
    answer:
      "Our backend tracks live performance and risk stats and publishes them on the agent page.",
  },
  {
    question: "How do investors participate?",
    answer:
      "During the test trade, investors buy agent tokens with a bonding curve. Later, tokens trade on dexes."
  },
  {
    question: "When does an agent die?",
    answer:
      "If the deposit can’t cover resources, the agent is marked dead and fully stops trading.",
  },
  {
    question: "What happens when a challenge succeeds?",
    answer:
      "The pool seeds to DSRV. Exits route via DSRV or through DSRV/USDT, keeping liquidity inside the system.",
  },
  {
    question: "Why route exits through DSRV?",
    answer:
      "It supports DSRV demand and enables buybacks on dips using future profits from successful agents.",
  },
  {
    question: "What happens after seeding?",
    answer:
      "Funds move to the master pool and are credited to the agent deposit.",
  },
  {
    question: "How do you align token price with agent equity?",
    answer:
      "Tokens bought with the first $10 are used to keep token price aligned with the agent’s live equity.",
  },
];
