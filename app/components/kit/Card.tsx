import { cn } from "~/lib/utils";

// components/ui/Card.tsx
export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-t-white/10 border-l-white/10 border-b-white/5 border-r-white/5 bg-white/10 backdrop-blur-glass box-shadow-glass p-6", className)}>
      {children}
    </div>
  );
}
