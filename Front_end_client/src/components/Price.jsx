import { discount, formatDA } from "../lib/format";

export default function Price({ price, oldPrice, size = "md" }) {
  const pct = discount(price, oldPrice);
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-4xl sm:text-5xl" };
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className={`price ${sizes[size]} text-ink`}>{formatDA(price)}</span>
      {pct > 0 && (
        <>
          <s className="text-sm text-ink-muted tabular-nums">{formatDA(oldPrice)}</s>
          <span className="rounded bg-star px-1.5 py-0.5 text-xs font-bold text-ink">−{pct} %</span>
        </>
      )}
    </div>
  );
}
