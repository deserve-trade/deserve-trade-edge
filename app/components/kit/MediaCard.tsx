// components/ui/MediaCard.tsx
export function MediaCard({ label }: { label?: string }) {
  return (
    <div className="h-40 rounded-lg bg-[var(--surface)] border-2 border-border
      flex items-center justify-center font-bold text-xl">
      {label}
    </div>
  );
}
