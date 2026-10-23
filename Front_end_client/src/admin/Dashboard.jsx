import { Link } from "react-router-dom";
import useApi from "../lib/useApi";
import { ErrorBox, Spinner, StatusBadge } from "../components/ui";
import { usePageTitle } from "../components/Layout";
import { AdminHeader } from "./AdminLayout";
import { STATUS, formatDA, formatDateTime } from "../lib/format";

export default function Dashboard() {
  usePageTitle("Administration");
  const { data, loading, error, reload } = useApi("/admin/stats");
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const toHandle = data.ordersByStatus.pending;

  return (
    <div>
      <AdminHeader title="Tableau de bord" />
      <Link
        to="/admin/commandes?statut=pending"
        className={`mb-6 flex flex-wrap items-baseline justify-between gap-2 rounded-lg p-5 ${toHandle ? "bg-star text-ink" : "bg-brand-soft"}`}
      >
        <span className="text-lg font-semibold">
          {toHandle ? `${toHandle} commande${toHandle > 1 ? "s" : ""} à confirmer` : "Aucune commande en attente"}
        </span>
        <span className="font-semibold underline">Ouvrir les commandes</span>
      </Link>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Chiffre d'affaires livré", formatDA(data.deliveredRevenue)],
          ["Commandes (30 jours)", data.last30Days.orders],
          ["Montant (30 jours)", formatDA(data.last30Days.revenue)],
          ["Clients inscrits", data.customers],
        ].map(([k, v]) => (
          <div key={k} className="panel p-4">
            <dt className="text-sm text-ink-muted">{k}</dt>
            <dd className="price mt-1 text-3xl">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="panel">
          <h2 className="border-b border-steel px-5 py-4 text-2xl">Dernières commandes</h2>
          {data.recentOrders.length === 0 ? (
            <p className="p-5 text-ink-muted">Les commandes apparaîtront ici dès la première vente.</p>
          ) : (
            <ul className="divide-y divide-steel">
              {data.recentOrders.map((o) => (
                <li key={o._id}>
                  <Link to={`/admin/commandes/${o._id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-paper">
                    <span className="w-44 font-semibold tabular-nums">{o.orderNumber}</span>
                    <span className="flex-1">
                      {o.customer.firstName} {o.customer.lastName}, {o.shipping.wilayaName}
                    </span>
                    <span className="tabular-nums">{formatDA(o.total)}</span>
                    <StatusBadge status={o.status} />
                    <span className="w-full text-sm text-ink-muted sm:w-auto">{formatDateTime(o.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="mb-3 text-2xl">Commandes par statut</h2>
            <ul className="space-y-2">
              {Object.entries(data.ordersByStatus).map(([s, n]) => (
                <li key={s}>
                  <Link to={`/admin/commandes?statut=${s}`} className="flex justify-between hover:underline">
                    <span>{STATUS[s].label}</span>
                    <span className="font-semibold tabular-nums">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel p-5">
            <h2 className="mb-3 text-2xl">Stock faible</h2>
            {data.lowStock.length === 0 ? (
              <p className="text-ink-muted">Tous les produits ont plus de 3 unités.</p>
            ) : (
              <ul className="space-y-2">
                {data.lowStock.map((p) => (
                  <li key={p._id} className="flex justify-between gap-3">
                    <Link to={`/admin/produits/${p._id}`} className="hover:underline">
                      {p.name}
                    </Link>
                    <span className={`font-semibold tabular-nums ${p.stock === 0 ? "text-danger" : ""}`}>{p.stock}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
