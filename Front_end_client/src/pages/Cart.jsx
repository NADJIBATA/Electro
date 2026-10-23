import { Link, useNavigate } from "react-router-dom";
import { IoTrashOutline } from "react-icons/io5";
import { useCart } from "../context/CartContext";
import useApi from "../lib/useApi";
import ProductImage from "../components/ProductImage";
import { EmptyState, QuantityStepper } from "../components/ui";
import { usePageTitle } from "../components/Layout";
import { formatDA } from "../lib/format";

export const shippingFor = (subtotal, config) =>
  !config ? 0 : config.freeShippingThreshold > 0 && subtotal >= config.freeShippingThreshold ? 0 : config.shippingFee;

export function Summary({ subtotal, config, children }) {
  const shipping = shippingFor(subtotal, config);
  return (
    <div className="panel p-5">
      <h2 className="mb-4 text-2xl">Récapitulatif</h2>
      <dl className="space-y-2">
        <div className="flex justify-between">
          <dt>Sous-total</dt>
          <dd className="tabular-nums">{formatDA(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Livraison</dt>
          <dd className="tabular-nums">{shipping === 0 ? "Offerte" : formatDA(shipping)}</dd>
        </div>
        {config?.freeShippingThreshold > 0 && shipping > 0 && (
          <p className="text-sm text-ink-muted">Livraison offerte dès {formatDA(config.freeShippingThreshold)} d'achat.</p>
        )}
        <div className="flex items-baseline justify-between border-t border-steel pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="price text-3xl">{formatDA(subtotal + shipping)}</dd>
        </div>
      </dl>
      {children}
    </div>
  );
}

export default function Cart() {
  usePageTitle("Panier");
  const { items, subtotal, setQuantity, remove } = useCart();
  const { data: config } = useApi("/meta/config");
  const navigate = useNavigate();

  if (!items.length)
    return (
      <div className="mx-auto max-w-shop px-4 py-10">
        <EmptyState title="Votre panier est vide" action={<Link to="/produits" className="btn-primary">Parcourir le catalogue</Link>}>
          Ajoutez des produits depuis le catalogue pour passer commande.
        </EmptyState>
      </div>
    );

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <h1 className="mb-6 text-4xl sm:text-5xl">Panier</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="panel divide-y divide-steel">
          {items.map((i) => (
            <li key={i._id} className="flex gap-4 p-4">
              <Link to={`/produit/${i.slug}`} className="h-24 w-24 shrink-0 rounded-md border border-steel bg-white p-1">
                <ProductImage src={i.image} alt={i.name} hint={i.category || i.name} />
              </Link>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <Link to={`/produit/${i.slug}`} className="font-medium hover:underline">
                    {i.name}
                  </Link>
                  <p className="text-sm text-ink-muted tabular-nums">{formatDA(i.price)} l'unité</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <QuantityStepper size="sm" value={i.quantity} max={Math.min(i.stock ?? 20, 20)} onChange={(v) => setQuantity(i._id, v)} />
                  <span className="price w-28 text-right text-lg">{formatDA(i.price * i.quantity)}</span>
                  <button className="text-ink-muted hover:text-danger" onClick={() => remove(i._id)} aria-label={`Retirer ${i.name} du panier`}>
                    <IoTrashOutline className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div>
          <Summary subtotal={subtotal} config={config}>
            <button className="btn-primary mt-5 w-full py-3 text-lg" onClick={() => navigate("/commande")}>
              Passer la commande
            </button>
            <Link to="/produits" className="mt-3 block text-center text-sm font-semibold text-brand-deep hover:underline">
              Continuer mes achats
            </Link>
          </Summary>
        </div>
      </div>
    </div>
  );
}
