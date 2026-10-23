import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api";
import OrderView from "./OrderView";
import { usePageTitle } from "../components/Layout";

export default function Track() {
  usePageTitle("Suivre ma commande");
  const [params] = useSearchParams();
  const [number, setNumber] = useState(params.get("commande") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const { data } = await api.get("/orders/track", { params: { number: number.trim(), phone: phone.replace(/\s/g, "") } });
      setOrder(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="text-4xl sm:text-5xl">Suivre ma commande</h1>
      <p className="mt-2 text-ink-muted">Saisissez le numéro reçu à la commande et le téléphone utilisé.</p>
      <form onSubmit={submit} className="panel mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="num">
            Numéro de commande
          </label>
          <input id="num" className="input uppercase" placeholder="EL-20261024-A1B2C3" value={number} onChange={(e) => setNumber(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="tel">
            Téléphone
          </label>
          <input id="tel" className="input" type="tel" inputMode="tel" placeholder="0551 23 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <button className="btn-primary h-[46px]" disabled={loading}>
          {loading ? "Recherche…" : "Suivre"}
        </button>
      </form>
      {error && (
        <p className="mt-4 rounded-md border border-danger/30 bg-white p-4 text-danger" role="alert">
          {error}
        </p>
      )}
      {order && (
        <div className="mt-6">
          <OrderView order={order} />
        </div>
      )}
    </div>
  );
}
