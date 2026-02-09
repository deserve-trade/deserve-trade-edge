import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/ui/button";

export default function PhantomCallback() {
  const [isClient, setIsClient] = useState(false);
  const [searchParams] = useSearchParams();
  const responseType = searchParams.get("response_type");
  const nextPath = searchParams.get("next") || "/wizard";
  const navigate = useNavigate();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (responseType === "success") {
      const timeout = window.setTimeout(() => navigate(nextPath), 900);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [isClient, navigate, nextPath, responseType]);

  if (!isClient) {
    return (
      <main className="min-h-screen pt-28 pb-16 px-6">
        <div className="max-w-xl mx-auto space-y-4 text-center">
          <h1 className="text-3xl font-display">Finish Phantom sign-in</h1>
          <p className="text-white/70">Loading Phantom connection...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-16 px-6">
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-display">Phantom sign-in</h1>
        <p className="text-white/70">
          {responseType === "success"
            ? "Success. Redirecting you to the wizard..."
            : "We couldn't complete the Phantom sign-in."}
        </p>
        <Card className="space-y-4 text-left">
          {responseType === "success" ? (
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-[0.25em] text-white/50">
                Status
              </div>
              <div className="text-lg font-semibold text-emerald-300">
                Connected
              </div>
              <p className="text-sm text-white/60">
                If nothing happens in a moment, use the button below to continue.
              </p>
              <Button onClick={() => navigate(nextPath)}>Continue</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-[0.25em] text-white/50">
                Status
              </div>
              <div className="text-lg font-semibold text-red-400">
                Authentication failed
              </div>
              <p className="text-sm text-white/60">
                Please try connecting Phantom again.
              </p>
              <Button onClick={() => navigate("/connect")}>Return to connect</Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
