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
    primary: "bg-primary text-primary-foreground border-2 border-border",
    outline: "border-2 border-border text-foreground",
    ghost: "bg-foreground/10 text-foreground",
    neon: "bg-secondary text-secondary-foreground border-2 border-border",
  };

  return (
    <button
      className={cn(
        "btn-text px-5 py-2 rounded-pill text-ui transition hover:-translate-y-0.5",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
