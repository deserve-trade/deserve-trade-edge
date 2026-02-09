import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border-2 border-border bg-[var(--surface)] shadow-[6px_6px_0_#1f1d20] p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
