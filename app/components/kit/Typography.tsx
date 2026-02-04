import { cn } from "~/lib/utils";

// components/Typography.tsx
export function GlitchTitle({ children, className }: { children: string, className?: string }) {
  return (
    <h1 className={cn("font-extrabold tracking-tight text-white drop-shadow-[2px_0_#ff2ec4] text-shadow:-2px_0_#00eaff]", className)}>
      {children}
    </h1>
  );
}
