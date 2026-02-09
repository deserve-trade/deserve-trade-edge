import type { Route } from "./+types/wizard";
import { authRequired } from "~/lib/middleware/auth-required";
import { Card } from "~/components/kit/Card";

export const middleware: Route.MiddlewareFunction[] = [authRequired];

export default function Wizard() {
  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <span className="tag-pill">Agent Wizard</span>
          <h1 className="text-4xl md:text-5xl font-display">
            Build your trading strategy
          </h1>
          <p className="text-lg text-white/70">
            This is the protected wizard page. The chat-driven strategy builder
            comes next.
          </p>
        </header>

        <Card className="space-y-4">
          <div className="text-sm uppercase tracking-[0.25em] text-white/50">
            Chat Session
          </div>
          <div className="text-white/80">
            MVP placeholder: the strategy assistant chat UI will live here.
          </div>
        </Card>
      </div>
    </main>
  );
}
