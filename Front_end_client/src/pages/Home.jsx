import { Link } from "react-router-dom";
import { IoCarOutline, IoCashOutline, IoCardOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import useApi from "../lib/useApi";
import ProductCard from "../components/ProductCard";
import { iconFor } from "../components/ProductImage";
import { Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";
import { GROUPS } from "../lib/format";

function Rayon({ group, categories }) {
  const meta = GROUPS[group];
  const dark = group === "gros-menagers";
  return (
    <section
      className={`flex flex-col justify-between gap-8 rounded-lg p-6 sm:p-8 ${dark ? "bg-ink text-white" : "border border-steel bg-white text-ink"}`}
      aria-labelledby={`rayon-${group}`}
    >
      <div>
        <h2 id={`rayon-${group}`} className="text-[2.75rem] leading-none sm:text-6xl">
          <Link to={meta.path} className="hover:underline decoration-star decoration-4 underline-offset-8">
            {meta.label}
          </Link>
        </h2>
        <p className={`mt-3 max-w-sm ${dark ? "text-white/70" : "text-ink-muted"}`}>
          {dark ? "Froid, lavage, cuisson, climatisation et image." : "Les appareils du quotidien, pour la cuisine et l'entretien."}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {categories.map((c) => {
          const Icon = iconFor(c.name);
          return (
            <li key={c._id}>
              <Link
                to={`/categorie/${c.slug}`}
                className={`flex items-center gap-3 rounded-md py-2 pr-2 font-medium ${dark ? "hover:text-star" : "hover:text-brand-deep"}`}
              >
                <Icon className={`h-6 w-6 shrink-0 ${dark ? "text-star" : "text-brand"}`} aria-hidden />
                <span>{c.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ProductRow({ title, to, linkLabel, url }) {
  const { data, loading } = useApi(url);
  if (loading) return <Spinner />;
  if (!data?.items?.length) return null;
  return (
    <section className="mt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        <Link to={to} className="shrink-0 font-semibold text-brand-deep hover:underline">
          {linkLabel}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.items.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  usePageTitle("");
  const { data: categories } = useApi("/categories");
  const { data: brands } = useApi("/brands");
  const { data: config } = useApi("/meta/config");

  const byGroup = (g) => (categories || []).filter((c) => c.group === g);

  return (
    <div className="mx-auto max-w-shop px-4 pt-6 sm:pt-10">
      <h1 className="sr-only">WebStar Electro, électroménager en Algérie</h1>
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Rayon group="gros-menagers" categories={byGroup("gros-menagers")} />
        <Rayon group="petits-menagers" categories={byGroup("petits-menagers")} />
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-brand-soft px-5 py-5 text-sm sm:text-base lg:grid-cols-4">
        <li className="flex items-center gap-3">
          <IoCarOutline className="h-7 w-7 shrink-0 text-brand-deep" aria-hidden />
          <span>Livraison dans les 69 wilayas</span>
        </li>
        <li className="flex items-center gap-3">
          <IoCashOutline className="h-7 w-7 shrink-0 text-brand-deep" aria-hidden />
          <span>Paiement à la livraison</span>
        </li>
        <li className="flex items-center gap-3">
          <IoCardOutline className="h-7 w-7 shrink-0 text-brand-deep" aria-hidden />
          <span>{config?.paymentMethods?.online ? "Carte CIB et Edahabia" : "Confirmation par téléphone"}</span>
        </li>
        <li className="flex items-center gap-3">
          <IoShieldCheckmarkOutline className="h-7 w-7 shrink-0 text-brand-deep" aria-hidden />
          <span>Produits neufs et garantis</span>
        </li>
      </ul>

      <ProductRow title="Promotions" to="/promotions" linkLabel="Toutes les promotions" url="/products?promo=true&limit=4" />
      <ProductRow title="Nos meilleures ventes" to="/produits" linkLabel="Tout le catalogue" url="/products?featured=true&limit=8" />

      {brands?.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl">Nos marques</h2>
            <Link to="/marques" className="font-semibold text-brand-deep hover:underline">
              Voir les marques
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <li key={b._id}>
                <Link
                  to={`/marque/${b.slug}`}
                  className="flex h-14 items-center gap-3 rounded-md border border-steel bg-white px-5 font-cond text-xl font-semibold hover:border-ink"
                >
                  {b.logo?.url ? <img src={b.logo.url} alt="" className="h-8 w-auto max-w-[96px] object-contain" /> : null}
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
