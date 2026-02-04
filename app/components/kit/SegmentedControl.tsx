// components/ui/Segmented.tsx
type Props = {
  items: string[];
  active: number;
};

export function Segmented({ items, active }: Props) {
  return (
    <div className="inline-flex bg-black/40 rounded-pill p-1">
      {items.map((item, i) => (
        <div
          key={item}
          className={`px-4 py-2 text-micro rounded-pill
            ${i === active
              ? "bg-neonCyan text-black"
              : "opacity-60"}`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}
