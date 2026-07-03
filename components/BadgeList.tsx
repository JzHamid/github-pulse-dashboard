type BadgeListProps = {
  items: string[];
};

export function BadgeList({ items }: BadgeListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium text-cyan-100"
          key={item}
        >
          {item}
        </span>
      ))}
    </div>
  );
}
