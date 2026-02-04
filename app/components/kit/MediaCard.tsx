// components/ui/MediaCard.tsx
export function MediaCard({ label }: { label?: string }) {
  return (
    <div className="h-40 rounded-lg bg-grad-accent
      shadow-inner shadow-white/10
      flex items-center justify-center font-bold text-xl">
      {label}
    </div>
  );
}
