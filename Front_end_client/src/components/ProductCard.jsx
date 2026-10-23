import { Link } from "react-router-dom";
import { IoCartOutline } from "react-icons/io5";
import ProductImage from "./ProductImage";
import Price from "./Price";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const toast = useToast();
  const out = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-steel bg-white transition-colors hover:border-ink/40">
      <Link to={`/produit/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square bg-white p-4">
          <ProductImage src={product.images?.[0]?.url} alt={product.name} hint={product.category?.name || product.name} />
          {out && (
            <span className="absolute left-3 top-3 rounded bg-ink px-2 py-0.5 text-xs font-semibold text-white">Rupture de stock</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 border-t border-steel px-4 pb-3 pt-3">
          {product.brand?.name && <span className="text-sm font-medium text-brand-deep">{product.brand.name}</span>}
          <h3 className="font-sans text-base font-medium leading-snug text-ink line-clamp-2">{product.name}</h3>
          <div className="mt-auto pt-2">
            <Price price={product.price} oldPrice={product.oldPrice} size="sm" />
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          type="button"
          className="btn-secondary w-full py-2 text-sm"
          disabled={out}
          onClick={() => {
            add(product, 1);
            toast(`${product.name} ajouté au panier.`);
          }}
        >
          <IoCartOutline className="h-4 w-4" aria-hidden />
          {out ? "Indisponible" : "Ajouter au panier"}
        </button>
      </div>
    </article>
  );
}
