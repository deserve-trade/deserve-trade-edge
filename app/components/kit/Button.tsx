// components/ui/Button.tsx
import { cn } from "~/lib/utils";

type Props = {
  variant?: "primary" | "outline" | "ghost" | "neon";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  className,
  ...props
}: Props) {
  const styles = {
    primary: "bg-grad-primary text-white",
    outline: "border border-white/30",
    ghost: "bg-white/10",
    neon: "bg-neonGreen text-black",
  };

  return (
    <button
      className={cn(
        "px-5 py-2 rounded-pill text-ui transition hover:-translate-y-0.5 hover:shadow-neon",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
