import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { IoCartOutline, IoCheckmark, IoCarOutline, IoCashOutline } from "react-icons/io5";
import useApi from "../lib/useApi";
import ProductImage from "../components/ProductImage";
import ProductCard from "../components/ProductCard";
import Price from "../components/Price";
import { Breadcrumbs, EmptyState, ErrorBox, QuantityStepper, Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { GROUPS, formatDA } from "../lib/format";

export default function Product() {
  const { slug } = useParams();
  const { data, loading, error, status, reload } = useApi(`/products/${slug}`);
  const { add } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const { data: config } = useApi("/meta/config");
  usePageTitle(data?.product?.name);

  if (loading) return <Spinner />;
  if (status === 404)
    return (
      <div className="mx-auto max-w-shop px-4 py-10">
        <EmptyState title="Ce produit n'existe plus" action={<Link to="/produits" className="btn-primary">Voir le catalogue</Link>}>
          Il a peut-être été retiré de la vente.
        </EmptyState>
      </div>
    );
  if (error) return <div className="mx-auto max-w-shop px-4 py-10"><ErrorBox message={error} onRetry={reload} /></div>;

  const { product, related } = data;
  const out = product.stock <= 0;
  const max = Math.min(product.stock, 20);
  const group = GROUPS[product.category?.group];
  const images = product.images || [];

  const addToCart = (go) => {
    add(product, qty);
    if (go) navigate("/panier");
    else toast(`${product.name} ajouté au panier.`);
  };

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs
        items={[
          { to: "/", label: "Accueil" },
          ...(group ? [{ to: group.path, label: group.label }] : []),
          ...(product.category ? [{ to: `/categorie/${product.category.slug}`, label: product.category.name }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <div className="panel aspect-square p-6">
            <ProductImage src={images[active]?.url} alt={product.name} hint={product.category?.name} />
          </div>
          {images.length > 1 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <li key={img.url}>
                  <button
                    onClick={() => setActive(i)}
                    className={`h-20 w-20 rounded-md border-2 bg-white p-1 ${i === active ? "border-brand-deep" : "border-steel"}`}
                    aria-label={`Image ${i + 1}`}
                    aria-pressed={i === active}
                  >
                    <ProductImage src={img.url} alt="" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {product.brand && (
            <Link to={`/marque/${product.brand.slug}`} className="font-semibold text-brand-deep hover:underline">
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-1 text-4xl sm:text-5xl">{product.name}</h1>

          <div className="mt-6 border-y border-steel py-5">
            <Price price={product.price} oldPrice={product.oldPrice} size="lg" />
            <p className={`mt-2 flex items-center gap-1.5 font-medium ${out ? "text-danger" : "text-brand-deep"}`}>
              {out ? (
                "Rupture de stock"
              ) : (
                <>
                  <IoCheckmark aria-hidden /> En stock{product.stock <= 3 ? ` — plus que ${product.stock}` : ""}
                </>
              )}
            </p>
          </div>

          {!out && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantityStepper value={qty} max={max} onChange={(v) => setQty(Math.max(1, Math.min(v, max)))} />
              <button className="btn-primary h-11 flex-1 sm:flex-none sm:px-8" onClick={() => addToCart(true)}>
                Commander
              </button>
              <button className="btn-secondary h-11" onClick={() => addToCart(false)}>
                <IoCartOutline className="h-5 w-5" aria-hidden /> Ajouter au panier
              </button>
            </div>
          )}

          <ul className="mt-6 space-y-2 text-ink-muted">
            <li className="flex items-center gap-2">
              <IoCarOutline className="h-5 w-5 text-brand-deep" aria-hidden />
              Livraison dans les 69 wilayas{config ? ` : ${formatDA(config.shippingFee)}` : ""}
              {config?.freeShippingThreshold > 0 ? `, offerte dès ${formatDA(config.freeShippingThreshold)}` : ""}
            </li>
            <li className="flex items-center gap-2">
              <IoCashOutline className="h-5 w-5 text-brand-deep" aria-hidden />
              Paiement à la livraison{config?.paymentMethods?.online ? " ou par carte CIB / Edahabia" : ""}
            </li>
          </ul>

          {product.characteristics?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-2xl">Caractéristiques</h2>
              <dl className="mt-3 divide-y divide-steel rounded-lg border border-steel bg-white">
                {product.characteristics.map((c, i) => {
                  const [k, ...v] = c.split(":");
                  return v.length ? (
                    <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-4 py-2.5">
                      <dt className="text-ink-muted">{k.trim()}</dt>
                      <dd className="font-medium">{v.join(":").trim()}</dd>
                    </div>
                  ) : (
                    <div key={i} className="px-4 py-2.5">
                      <dd className="font-medium">{c}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}

          {product.description && (
            <section className="mt-8">
              <h2 className="text-2xl">Description</h2>
              <p className="mt-2 max-w-prose whitespace-pre-line text-ink-muted">{product.description}</p>
            </section>
          )}
        </div>
      </div>

      {related?.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-3xl">Dans la même catégorie</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={{ ...p, category: product.category }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
