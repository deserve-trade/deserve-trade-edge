import { useState } from "react";
import { calculateRealisticChallengePrice } from "~/lib/challenges";
import { Card } from "../kit/Card";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";

export default function ChallengeForm() {

  const [accountSize, setAccountSize] = useState(10000);
  const [steps, setSteps] = useState(2);
  const [profitTarget, setProfitTarget] = useState(10);
  const [maxDrawdown, setMaxDrawdown] = useState(10);

  const challengePrice = calculateRealisticChallengePrice({
    accountSize,
    steps,
    firstStepProfit: profitTarget / 100,
    profitDecay: 0.8,
    effectiveDrawdown: maxDrawdown / 100
  });

  return (
    <Card className="mx-auto max-w-240 flex flex-col gap-8">
      <div className="grid gap-4">
        <div className="flex flex-row justify-between items-baseline gap-4">
          <div>
            Account Size
          </div>
          <div className="text-xl">
            ${accountSize.toLocaleString()}
          </div>
        </div>
        <Slider min={500} max={100000} defaultValue={[accountSize]} step={100} onValueChange={(value) => setAccountSize(value[0])}></Slider>
      </div>
      <div className="grid gap-4">
        <div className="flex flex-row justify-between items-baseline gap-4">
          <div>
            Steps
          </div>
          <div className="text-xl">
            {steps} Steps
          </div>
        </div>
        <Slider min={1} max={5} defaultValue={[steps]} step={1} onValueChange={(value) => setSteps(value[0])}></Slider>
      </div>
      <div className="grid gap-4">
        <div className="flex flex-row justify-between items-baseline gap-4">
          <div>
            Profit Target
          </div>
          <div className="text-xl">
            {profitTarget}%
          </div>
        </div>
        <Slider min={8} max={50} defaultValue={[profitTarget]} step={1} onValueChange={(value) => setProfitTarget(value[0])}></Slider>
      </div>
      <div className="grid gap-4">
        <div className="flex flex-row justify-between items-baseline gap-4">
          <div>
            Max Drawdown
          </div>
          <div className="text-xl">
            {maxDrawdown}%
          </div>
        </div>
        <Slider min={2} max={50} defaultValue={[maxDrawdown]} step={1} onValueChange={(value) => setMaxDrawdown(value[0])}></Slider>
      </div>
      <div className="my-8 flex flex-row justify-around gap-8">
        <div>
          <div className="text-sm text-white/50">
            Profit targets
          </div>
          <div className="text-2xl">
            {challengePrice.stepProfits.map((p, i) => (
              <span key={i}> {Math.floor(p * 100)}%</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-center">
        <Button size="xl" variant="secondary" className="rounded-full cursor-pointer box-shadow-glass">
          Buy ${Math.floor(challengePrice.challengePrice).toLocaleString()}
        </Button>
      </div>
    </Card>
  );
}
