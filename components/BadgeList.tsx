type BadgeListProps = {
  items: string[];
  tone?: "cyan" | "emerald" | "amber" | "sky";
};

const badgeToneClasses = {
  amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  sky: "border-sky-300/25 bg-sky-300/10 text-sky-100",
};

export function BadgeList({ items, tone = "cyan" }: BadgeListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${badgeToneClasses[tone]}`}
          key={item}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
