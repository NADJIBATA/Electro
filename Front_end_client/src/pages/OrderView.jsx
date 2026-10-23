// Affichage d'une commande (réutilisé par la confirmation, le suivi et le compte)
import ProductImage from "../components/ProductImage";
import { StatusBadge } from "../components/ui";
import { PAYMENT_METHOD, PAYMENT_STATUS, STATUS, formatDA, formatDateTime } from "../lib/format";

const STEPS = ["pending", "confirmed", "shipped", "delivered"];

export function Progress({ status }) {
  if (status === "cancelled") return <p className="font-semibold text-ink-muted">Cette commande a été annulée.</p>;
  const idx = STEPS.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Avancement de la commande">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-col gap-2" aria-current={i === idx ? "step" : undefined}>
          <span className={`h-2 rounded-full ${i <= idx ? "bg-brand" : "bg-steel"}`} />
          <span className={`text-xs sm:text-sm ${i <= idx ? "font-semibold text-ink" : "text-ink-muted"}`}>{STATUS[s].label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function OrderView({ order, actions }) {
  return (
    <div className="panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-steel p-5">
        <div>
          <p className="text-sm text-ink-muted">Commande du {formatDateTime(order.createdAt)}</p>
          <p className="font-cond text-2xl font-semibold tabular-nums">{order.orderNumber}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="p-5">
        <Progress status={order.status} />
      </div>
      <ul className="divide-y divide-steel border-t border-steel">
        {order.items.map((i) => (
          <li key={i.product + i.name} className="flex items-center gap-4 px-5 py-3">
            <div className="h-14 w-14 shrink-0 rounded border border-steel bg-white p-1">
              <ProductImage src={i.image} alt="" hint={i.name} />
            </div>
            <span className="flex-1">
              {i.quantity} × {i.name}
            </span>
            <span className="tabular-nums">{formatDA(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid gap-x-8 gap-y-2 border-t border-steel p-5 sm:grid-cols-2">
        <div className="flex justify-between sm:block">
          <dt className="text-sm text-ink-muted">Livraison</dt>
          <dd>
            {order.shipping.commune}, {order.shipping.wilayaName}
          </dd>
        </div>
        <div className="flex justify-between sm:block">
          <dt className="text-sm text-ink-muted">Paiement</dt>
          <dd>
            {PAYMENT_METHOD[order.paymentMethod]} — {PAYMENT_STATUS[order.paymentStatus]}
          </dd>
        </div>
        <div className="flex justify-between sm:block">
          <dt className="text-sm text-ink-muted">Frais de livraison</dt>
          <dd className="tabular-nums">{order.shippingFee ? formatDA(order.shippingFee) : "Offerts"}</dd>
        </div>
        <div className="flex justify-between sm:block">
          <dt className="text-sm text-ink-muted">Total</dt>
          <dd className="price text-2xl">{formatDA(order.total)}</dd>
        </div>
      </dl>
      {actions && <div className="flex flex-wrap gap-3 border-t border-steel p-5">{actions}</div>}
    </div>
  );
}
