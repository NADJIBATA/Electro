import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { IoCashOutline, IoCardOutline } from "react-icons/io5";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import useApi from "../lib/useApi";
import { api, errorMessage, fieldErrors } from "../lib/api";
import { Summary } from "./Cart";
import { usePageTitle } from "../components/Layout";
import { formatDA } from "../lib/format";

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      {error && (
        <p className="mt-1 text-sm font-medium text-danger" id={`${id}-err`}>
          {error}
        </p>
      )}
    </div>
  );
}

const PHONE_RX = /^(\+213|0)[5-7]\d{8}$/;

export default function Checkout() {
  usePageTitle("Commande");
  const { items, subtotal, clear, setItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: wilayas } = useApi("/meta/wilayas");
  const { data: config } = useApi("/meta/config");

  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    email: user?.email || "",
    wilayaCode: user?.address?.wilaya ? String(user.address.wilaya) : "",
    commune: user?.address?.commune || "",
    address: user?.address?.line || "",
    note: "",
    paymentMethod: "cod",
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const placed = useRef(false);

  if (!items.length && !placed.current) return <Navigate to="/panier" replace />;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.firstName.trim().length < 2) e.firstName = "Indiquez votre prénom.";
    if (form.lastName.trim().length < 2) e.lastName = "Indiquez votre nom.";
    if (!PHONE_RX.test(form.phone.replace(/\s/g, ""))) e.phone = "Numéro invalide. Exemple : 0551 23 45 67.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Adresse email invalide.";
    if (!form.wilayaCode) e.wilayaCode = "Choisissez votre wilaya.";
    if (form.commune.trim().length < 2) e.commune = "Indiquez votre commune.";
    if (form.address.trim().length < 5) e.address = "Indiquez une adresse précise (rue, cité, bâtiment).";
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setGlobalError("");
    if (Object.keys(v).length) {
      document.getElementById(Object.keys(v)[0])?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone.replace(/\s/g, ""),
          email: form.email,
        },
        shipping: { wilayaCode: Number(form.wilayaCode), commune: form.commune, address: form.address, note: form.note },
        items: items.map((i) => ({ productId: i._id, quantity: i.quantity })),
        paymentMethod: form.paymentMethod,
      });
      placed.current = true;
      clear();
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      navigate(`/commande/${data.order._id}?nouvelle=1`, { replace: true, state: { order: data.order } });
    } catch (err) {
      const fe = fieldErrors(err);
      const mapped = Object.fromEntries(Object.entries(fe).map(([k, msg]) => [k.split(".").pop(), msg]));
      setErrors(mapped);
      setGlobalError(errorMessage(err));
      // Stock insuffisant : on retire ou ajuste l'article concerné
      const pid = err.response?.data?.details?.find((d) => d.productId)?.productId;
      if (err.response?.status === 409 && pid) {
        try {
          const { data } = await api.get(`/products/${pid}`);
          setItems((prev) =>
            data.product.stock > 0
              ? prev.map((i) => (i._id === pid ? { ...i, stock: data.product.stock, quantity: Math.min(i.quantity, data.product.stock) } : i))
              : prev.filter((i) => i._id !== pid)
          );
          setGlobalError(`${errorMessage(err)} Votre panier a été ajusté, vérifiez-le avant de valider à nouveau.`);
        } catch {
          /* produit retiré */
        }
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const online = config?.paymentMethods?.online;

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <h1 className="mb-6 text-4xl sm:text-5xl">Finaliser la commande</h1>
      {globalError && (
        <div className="mb-6 rounded-md border border-danger/30 bg-white p-4 text-danger" role="alert">
          {globalError}
        </div>
      )}
      {!user && (
        <p className="mb-6 text-ink-muted">
          Vous avez un compte ?{" "}
          <Link to="/connexion?retour=/commande" className="font-semibold text-brand-deep underline">
            Connectez-vous
          </Link>{" "}
          pour retrouver vos commandes. Sinon, commandez directement.
        </p>
      )}

      <form className="grid gap-6 lg:grid-cols-[1fr_22rem]" onSubmit={submit} noValidate>
        <div className="space-y-6">
          <fieldset className="panel grid gap-4 p-5 sm:grid-cols-2">
            <legend className="sr-only">Vos coordonnées</legend>
            <h2 className="text-2xl sm:col-span-2">Vos coordonnées</h2>
            <Field id="firstName" label="Prénom" error={errors.firstName}>
              <input id="firstName" className="input" autoComplete="given-name" value={form.firstName} onChange={update("firstName")} aria-invalid={!!errors.firstName} />
            </Field>
            <Field id="lastName" label="Nom" error={errors.lastName}>
              <input id="lastName" className="input" autoComplete="family-name" value={form.lastName} onChange={update("lastName")} aria-invalid={!!errors.lastName} />
            </Field>
            <Field id="phone" label="Téléphone" error={errors.phone} hint="Nous vous appelons pour confirmer la commande.">
              <input id="phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="0551 23 45 67" value={form.phone} onChange={update("phone")} aria-invalid={!!errors.phone} />
            </Field>
            <Field id="email" label="Email (facultatif)" error={errors.email} hint="Pour recevoir la confirmation et le suivi.">
              <input id="email" className="input" type="email" autoComplete="email" value={form.email} onChange={update("email")} aria-invalid={!!errors.email} />
            </Field>
          </fieldset>

          <fieldset className="panel grid gap-4 p-5 sm:grid-cols-2">
            <legend className="sr-only">Livraison</legend>
            <h2 className="text-2xl sm:col-span-2">Livraison</h2>
            <Field id="wilayaCode" label="Wilaya" error={errors.wilayaCode}>
              <select id="wilayaCode" className="input" value={form.wilayaCode} onChange={update("wilayaCode")} aria-invalid={!!errors.wilayaCode}>
                <option value="">Choisir…</option>
                {(wilayas || []).map((w) => (
                  <option key={w.code} value={w.code}>
                    {String(w.code).padStart(2, "0")} - {w.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="commune" label="Commune" error={errors.commune}>
              <input id="commune" className="input" autoComplete="address-level2" value={form.commune} onChange={update("commune")} aria-invalid={!!errors.commune} />
            </Field>
            <div className="sm:col-span-2">
              <Field id="address" label="Adresse" error={errors.address}>
                <input id="address" className="input" autoComplete="street-address" placeholder="Cité, rue, bâtiment, étage" value={form.address} onChange={update("address")} aria-invalid={!!errors.address} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id="note" label="Instructions pour le livreur (facultatif)" error={errors.note}>
                <textarea id="note" className="input min-h-20" value={form.note} onChange={update("note")} maxLength={500} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="panel p-5">
            <legend className="sr-only">Paiement</legend>
            <h2 className="mb-4 text-2xl">Paiement</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { v: "cod", icon: IoCashOutline, t: "À la livraison", d: "Vous payez en espèces au livreur." },
                ...(online ? [{ v: "online", icon: IoCardOutline, t: "Carte CIB ou Edahabia", d: "Paiement sécurisé par Chargily Pay." }] : []),
              ].map((o) => (
                <label
                  key={o.v}
                  className={`flex cursor-pointer gap-3 rounded-md border-2 p-4 ${form.paymentMethod === o.v ? "border-brand-deep bg-brand-soft" : "border-steel bg-white"}`}
                >
                  <input type="radio" name="pay" value={o.v} checked={form.paymentMethod === o.v} onChange={update("paymentMethod")} className="mt-1 h-4 w-4 accent-brand-deep" />
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      <o.icon className="h-5 w-5" aria-hidden /> {o.t}
                    </span>
                    <span className="text-sm text-ink-muted">{o.d}</span>
                  </span>
                </label>
              ))}
            </div>
            {online && config.onlinePaymentMode === "test" && form.paymentMethod === "online" && (
              <p className="mt-3 text-sm text-ink-muted">Mode test : aucun débit réel ne sera effectué.</p>
            )}
          </fieldset>
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start">
          <Summary subtotal={subtotal} config={config}>
            <ul className="mt-4 space-y-1 border-t border-steel pt-4 text-sm text-ink-muted">
              {items.map((i) => (
                <li key={i._id} className="flex justify-between gap-3">
                  <span className="line-clamp-1">
                    {i.quantity} × {i.name}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatDA(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <button type="submit" className="btn-primary mt-5 w-full py-3 text-lg" disabled={submitting}>
              {submitting ? "Envoi…" : form.paymentMethod === "online" ? "Payer la commande" : "Valider la commande"}
            </button>
            <p className="mt-3 text-center text-xs text-ink-muted">Les prix sont confirmés au moment de la validation.</p>
          </Summary>
        </div>
      </form>
    </div>
  );
}
