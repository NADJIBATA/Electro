import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import useApi from "../lib/useApi";
import { api, errorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { ErrorBox, Pagination, Spinner, StatusBadge } from "../components/ui";
import ProductImage from "../components/ProductImage";
import { Progress } from "../pages/OrderView";
import { usePageTitle } from "../components/Layout";
import { AdminHeader } from "./AdminLayout";
import { PAYMENT_METHOD, PAYMENT_STATUS, STATUS, formatDA, formatDateTime } from "../lib/format";

export function OrdersList() {
  usePageTitle("Commandes");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const status = params.get("statut") || "";
  const page = params.get("page") || "1";
  const q = new URLSearchParams({ page, limit: "20" });
  if (status) q.set("status", status);
  if (params.get("q")) q.set("search", params.get("q"));
  const { data, loading, error, reload } = useApi(`/admin/orders?${q}`);

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    if (k !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <div>
      <AdminHeader title="Commandes" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filtrer par statut">
          {[["", "Toutes"], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
            <button
              key={k}
              role="tab"
              aria-selected={status === k}
              onClick={() => set("statut", k)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${status === k ? "bg-ink text-white" : "bg-white text-ink hover:bg-steel"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <form
          className="ml-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set("q", search.trim());
          }}
        >
          <label htmlFor="osearch" className="sr-only">
            Rechercher une commande
          </label>
          <input id="osearch" className="input w-64 py-2" placeholder="N°, nom, téléphone…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-secondary py-2">Rechercher</button>
        </form>
      </div>

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <p className="panel p-6 text-ink-muted">Aucune commande pour ce filtre.</p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-steel text-sm text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Commande</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Wilaya</th>
                <th className="px-4 py-3 font-medium">Paiement</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel">
              {data.items.map((o) => (
                <tr key={o._id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link to={`/admin/commandes/${o._id}`} className="font-semibold tabular-nums text-brand-deep hover:underline">
                      {o.orderNumber}
                    </Link>
                    <div className="text-sm text-ink-muted">{formatDateTime(o.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    {o.customer.firstName} {o.customer.lastName}
                    <div className="text-sm tabular-nums text-ink-muted">{o.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3">{o.shipping.wilayaName}</td>
                  <td className="px-4 py-3 text-sm">
                    {PAYMENT_METHOD[o.paymentMethod]}
                    <div className={o.paymentStatus === "paid" ? "font-semibold text-brand-deep" : "text-ink-muted"}>{PAYMENT_STATUS[o.paymentStatus]}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatDA(o.total)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => set("page", String(p))} />}
    </div>
  );
}

const NEXT = {
  pending: [["confirmed", "Confirmer la commande", "btn-primary"]],
  confirmed: [["shipped", "Marquer comme expédiée", "btn-primary"]],
  shipped: [["delivered", "Marquer comme livrée", "btn-primary"]],
};

export function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: order, loading, error, reload, setData } = useApi(`/admin/orders/${id}`);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  usePageTitle(order ? order.orderNumber : "Commande");
  useEffect(() => setNote(""), [order?.status]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const act = async (fn, okMsg) => {
    setBusy(true);
    try {
      const { data } = await fn();
      setData({ ...data, user: order.user });
      toast(okMsg);
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };
  const setStatus = (status, label) =>
    act(() => api.patch(`/admin/orders/${id}/status`, { status, note }), label);

  const c = order.customer;
  const s = order.shipping;
  const canCancel = ["pending", "confirmed", "shipped"].includes(order.status);
  const unpaidOnline = order.paymentMethod === "online" && order.paymentStatus !== "paid";

  return (
    <div className="max-w-4xl">
      <Link to="/admin/commandes" className="text-sm font-semibold text-brand-deep hover:underline">
        Toutes les commandes
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl tabular-nums">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
      </div>

      {order.status === "cancelled" && order.paymentStatus === "paid" && (
        <p className="mb-4 rounded-md bg-star p-4 font-semibold" role="alert">
          Cette commande annulée a été payée en ligne : remboursez le client puis marquez-la comme remboursée.
        </p>
      )}

      <section className="panel mb-6 p-5">
        <Progress status={order.status} />
        {(NEXT[order.status] || canCancel) && (
          <div className="mt-5 border-t border-steel pt-5">
            <label htmlFor="note" className="label">
              Note interne (facultatif, visible dans l'historique)
            </label>
            <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. : client joint, livraison prévue jeudi" />
            <div className="mt-3 flex flex-wrap gap-2">
              {(NEXT[order.status] || []).map(([st, label, cls]) => (
                <button key={st} className={cls} disabled={busy || unpaidOnline} onClick={() => setStatus(st, `Commande : ${STATUS[st].label.toLowerCase()}.`)}>
                  {label}
                </button>
              ))}
              {canCancel && (
                <button
                  className="btn-danger"
                  disabled={busy}
                  onClick={() => window.confirm("Annuler cette commande ? Le stock sera remis en vente.") && setStatus("cancelled", "Commande annulée, stock remis en vente.")}
                >
                  Annuler la commande
                </button>
              )}
            </div>
            {unpaidOnline && order.status === "pending" && (
              <p className="mt-2 text-sm text-ink-muted">En attente du paiement en ligne. Sans paiement, elle sera annulée automatiquement.</p>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 text-2xl">Client</h2>
          <p className="font-semibold">
            {c.firstName} {c.lastName}
          </p>
          <p>
            <a href={`tel:${c.phone}`} className="text-lg font-semibold tabular-nums text-brand-deep hover:underline">
              {c.phone}
            </a>
          </p>
          {c.email && <p className="text-ink-muted">{c.email}</p>}
          <p className="mt-2 text-sm text-ink-muted">{order.user ? "Client avec compte" : "Commande sans compte"}</p>
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 text-2xl">Livraison</h2>
          <p>{s.address}</p>
          <p>
            {s.commune}, {String(s.wilayaCode).padStart(2, "0")} - {s.wilayaName}
          </p>
          {s.note && <p className="mt-2 rounded bg-paper p-2 text-sm">{s.note}</p>}
        </section>
      </div>

      <section className="panel mt-6">
        <h2 className="border-b border-steel px-5 py-4 text-2xl">Articles</h2>
        <ul className="divide-y divide-steel">
          {order.items.map((i) => (
            <li key={i.product + i.name} className="flex items-center gap-4 px-5 py-3">
              <div className="h-12 w-12 shrink-0 rounded border border-steel bg-white p-1">
                <ProductImage src={i.image} alt="" hint={i.name} />
              </div>
              <span className="flex-1">
                {i.quantity} × {i.name}
              </span>
              <span className="tabular-nums">{formatDA(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-steel px-5 py-4">
          <div className="flex justify-between">
            <dt>Livraison</dt>
            <dd className="tabular-nums">{formatDA(order.shippingFee)}</dd>
          </div>
          <div className="flex justify-between text-xl font-semibold">
            <dt>Total</dt>
            <dd className="price">{formatDA(order.total)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-3 text-2xl">Paiement</h2>
          <p>{PAYMENT_METHOD[order.paymentMethod]}</p>
          <p className={order.paymentStatus === "paid" ? "font-semibold text-brand-deep" : "text-ink-muted"}>
            {PAYMENT_STATUS[order.paymentStatus]}
            {order.payment?.paidAt ? ` le ${formatDateTime(order.payment.paidAt)}` : ""}
          </p>
          {order.payment?.checkoutId && <p className="mt-1 break-all text-sm text-ink-muted">Chargily : {order.payment.checkoutId}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {order.paymentStatus !== "paid" && order.paymentStatus !== "refunded" && order.paymentMethod === "cod" && (
              <button className="btn-secondary py-2" disabled={busy} onClick={() => act(() => api.patch(`/admin/orders/${id}/payment`, { paymentStatus: "paid" }), "Paiement enregistré.")}>
                Marquer comme payée
              </button>
            )}
            {order.paymentStatus === "paid" && (
              <button
                className="btn-secondary py-2"
                disabled={busy}
                onClick={() => window.confirm("Confirmer que le client a été remboursé ?") && act(() => api.patch(`/admin/orders/${id}/payment`, { paymentStatus: "refunded" }), "Remboursement enregistré.")}
              >
                Marquer comme remboursée
              </button>
            )}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="mb-3 text-2xl">Historique</h2>
          <ol className="space-y-2">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold">{STATUS[h.status]?.label}</span> <span className="text-ink-muted">{formatDateTime(h.at)}</span>
                {h.note && <p className="text-ink-muted">{h.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
