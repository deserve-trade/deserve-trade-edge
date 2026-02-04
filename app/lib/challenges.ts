type RealisticChallengeParams = {
  accountSize: number;     // A — размер аккаунта
  effectiveDrawdown: number; // D_eff — реальный риск на шаг (например 0.02)
  steps: number;           // количество шагов
  firstStepProfit: number; // p1 — прибыль первого шага
  profitDecay: number;     // k — уменьшение цели на шаг
  targetMargin?: number;   // маржа фирмы (по умолчанию 0.2)
};

type ChallengeResult = {
  stepProfits: number[];
  stepPassRates: number[];
  totalPassProbability: number;
  riskExposure: number;
  challengePrice: number;
  expectedProfit: number;
  profitMargin: number;
};

export function calculateRealisticChallengePrice(
  params: RealisticChallengeParams
): ChallengeResult {
  const {
    accountSize,
    effectiveDrawdown,
    steps,
    firstStepProfit,
    profitDecay,
    targetMargin = 0.2
  } = params;

  if (steps <= 0) throw new Error("steps must be >= 1");

  // 1️⃣ Целевой профит на каждом шаге
  const stepProfits: number[] = Array.from(
    { length: steps },
    (_, i) => firstStepProfit * Math.pow(profitDecay, i)
  );

  // 2️⃣ Вероятность пройти каждый шаг с учетом D_eff
  const stepPassRates: number[] = stepProfits.map(
    p => effectiveDrawdown / (effectiveDrawdown + p)
  );

  // 3️⃣ Итоговая вероятность пройти весь челленж
  const totalPassProbability = stepPassRates.reduce((acc, q) => acc * q, 1);

  // 4️⃣ Эффективный риск фирмы
  const riskExposure = accountSize * effectiveDrawdown;

  // 5️⃣ Цена челленжа
  const challengePrice =
    (totalPassProbability * riskExposure) /
    (1 - targetMargin - totalPassProbability);

  // 6️⃣ Ожидаемая прибыль
  const expectedProfit =
    challengePrice * (1 - totalPassProbability) -
    totalPassProbability * riskExposure;

  return {
    stepProfits,
    stepPassRates,
    totalPassProbability,
    riskExposure,
    challengePrice,
    expectedProfit,
    profitMargin: expectedProfit / challengePrice
  };
}
