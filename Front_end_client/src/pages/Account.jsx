import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useApi from "../lib/useApi";
import { api, errorMessage } from "../lib/api";
import OrderView from "./OrderView";
import { EmptyState, ErrorBox, Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";

function Orders() {
  const { data, loading, error, reload } = useApi("/orders/mine");
  const toast = useToast();
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data.length)
    return (
      <EmptyState title="Aucune commande pour l'instant" action={<Link to="/produits" className="btn-primary">Parcourir le catalogue</Link>}>
        Vos commandes passées avec ce compte apparaîtront ici.
      </EmptyState>
    );

  const cancel = async (o) => {
    if (!window.confirm(`Annuler la commande ${o.orderNumber} ?`)) return;
    try {
      await api.post(`/orders/${o._id}/cancel`);
      toast("Commande annulée.");
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-4">
      {data.map((o) => (
        <OrderView
          key={o._id}
          order={o}
          actions={
            o.status === "pending" && o.paymentStatus !== "paid" ? (
              <>
                {o.checkoutUrl && (
                  <a href={o.checkoutUrl} className="btn-primary">
                    Reprendre le paiement
                  </a>
                )}
                <button className="btn-danger" onClick={() => cancel(o)}>
                  Annuler la commande
                </button>
              </>
            ) : null
          }
        />
      ))}
    </div>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const { data: wilayas } = useApi("/meta/wilayas");
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || "",
    wilaya: user.address?.wilaya ? String(user.address.wilaya) : "",
    commune: user.address?.commune || "",
    line: user.address?.line || "",
    currentPassword: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone.replace(/\s/g, ""),
        address: { wilaya: form.wilaya ? Number(form.wilaya) : null, commune: form.commune, line: form.line },
      };
      if (form.newPassword) Object.assign(payload, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      const { data } = await api.patch("/auth/me", payload);
      setUser(data.user);
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
      toast("Profil enregistré.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const input = (k, label, props = {}) => (
    <div>
      <label className="label" htmlFor={`p-${k}`}>
        {label}
      </label>
      <input id={`p-${k}`} className="input" value={form[k]} onChange={set(k)} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="panel grid gap-4 p-5 sm:grid-cols-2">
      {error && (
        <p className="rounded-md bg-danger/10 p-3 text-danger sm:col-span-2" role="alert">
          {error}
        </p>
      )}
      {input("firstName", "Prénom")}
      {input("lastName", "Nom")}
      <div>
        <span className="label">Email</span>
        <p className="py-2.5 text-ink-muted">{user.email}</p>
      </div>
      {input("phone", "Téléphone", { type: "tel" })}
      <h2 className="mt-2 text-2xl sm:col-span-2">Adresse de livraison par défaut</h2>
      <div>
        <label className="label" htmlFor="p-wilaya">
          Wilaya
        </label>
        <select id="p-wilaya" className="input" value={form.wilaya} onChange={set("wilaya")}>
          <option value="">—</option>
          {(wilayas || []).map((w) => (
            <option key={w.code} value={w.code}>
              {String(w.code).padStart(2, "0")} - {w.name}
            </option>
          ))}
        </select>
      </div>
      {input("commune", "Commune")}
      <div className="sm:col-span-2">{input("line", "Adresse")}</div>
      <h2 className="mt-2 text-2xl sm:col-span-2">Changer de mot de passe</h2>
      {input("currentPassword", "Mot de passe actuel", { type: "password", autoComplete: "current-password" })}
      {input("newPassword", "Nouveau mot de passe", { type: "password", autoComplete: "new-password", minLength: 8 })}
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

export default function Account() {
  usePageTitle("Mon compte");
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("orders");
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl sm:text-5xl">Bonjour {user.firstName}</h1>
        <button className="text-sm font-semibold text-ink-muted underline hover:text-ink" onClick={logout}>
          Se déconnecter
        </button>
      </div>
      <div className="mb-6 flex gap-1 border-b border-steel" role="tablist">
        {[
          ["orders", "Mes commandes"],
          ["profile", "Mes informations"],
        ].map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 font-semibold ${tab === k ? "border-brand-deep text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "orders" ? <Orders /> : <Profile />}
    </div>
  );
}
