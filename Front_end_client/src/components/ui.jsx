import { Link } from "react-router-dom";
import { STATUS } from "../lib/format";

export function Spinner({ label = "Chargement…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-steel-dark border-t-brand-deep" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="rounded-md border border-danger/30 bg-white p-4 text-danger" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="mt-2 font-semibold underline" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h2 className="text-2xl">{title}</h2>
      {children && <div className="max-w-md text-ink-muted">{children}</div>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: "bg-steel" };
  return <span className={`inline-block rounded px-2 py-0.5 text-sm font-semibold ${s.tone}`}>{s.label}</span>;
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  return (
    <nav className="flex items-center justify-center gap-1 pt-8" aria-label="Pagination">
      <button className="btn-secondary px-3 py-1.5" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Précédent
      </button>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={`h-9 min-w-9 rounded-md px-2 font-semibold tabular-nums ${n === page ? "bg-ink text-white" : "hover:bg-steel"}`}
        >
          {n}
        </button>
      ))}
      <button className="btn-secondary px-3 py-1.5" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Suivant
      </button>
    </nav>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {it.to ? (
              <Link to={it.to} className="hover:text-ink hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="text-ink">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function QuantityStepper({ value, max = 20, onChange, size = "md" }) {
  const h = size === "sm" ? "h-9" : "h-11";
  return (
    <div className={`inline-flex ${h} items-stretch overflow-hidden rounded-md border border-steel-dark bg-white`}>
      <button type="button" className="w-9 text-lg hover:bg-steel disabled:opacity-40" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Diminuer la quantité">
        −
      </button>
      <span className="flex w-10 items-center justify-center border-x border-steel font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className="w-9 text-lg hover:bg-steel disabled:opacity-40" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Augmenter la quantité">
        +
      </button>
    </div>
  );
}
