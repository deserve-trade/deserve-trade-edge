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
        "rounded-2xl border border-t-white/10 border-l-white/10 border-b-white/5 border-r-white/5 bg-white/10 backdrop-blur-glass box-shadow-glass p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
