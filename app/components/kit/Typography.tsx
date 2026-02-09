import { cn } from "~/lib/utils";

// components/Typography.tsx
export function GlitchTitle({ children, className }: { children: string, className?: string }) {
  return (
    <h1 className={cn("font-extrabold tracking-[0.08em] text-foreground uppercase", className)}>
      {children}
    </h1>
  );
}
