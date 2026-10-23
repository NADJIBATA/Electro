import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { IoOptionsOutline, IoClose } from "react-icons/io5";
import useApi from "../lib/useApi";
import ProductCard from "../components/ProductCard";
import { Breadcrumbs, EmptyState, ErrorBox, Pagination, Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";
import { GROUPS } from "../lib/format";

const SORTS = [
  ["newest", "Nouveautés"],
  ["price-asc", "Prix croissant"],
  ["price-desc", "Prix décroissant"],
  ["name", "Nom (A → Z)"],
];

function Filters({ params, set, categories, brands, lockedCategory, lockedBrand, group }) {
  const selectedBrands = (params.get("marque") || "").split(",").filter(Boolean);
  const [min, setMin] = useState(params.get("min") || "");
  const [max, setMax] = useState(params.get("max") || "");
  useEffect(() => {
    setMin(params.get("min") || "");
    setMax(params.get("max") || "");
  }, [params]);

  const visibleCats = (categories || []).filter((c) => !group || c.group === group);

  return (
    <div className="space-y-7">
      {!lockedCategory && visibleCats.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-semibold">Catégorie</legend>
          <ul className="space-y-1">
            <li>
              <button className={`w-full rounded px-2 py-1.5 text-left ${!params.get("categorie") ? "bg-ink text-white" : "hover:bg-steel"}`} onClick={() => set({ categorie: null })}>
                Toutes
              </button>
            </li>
            {visibleCats.map((c) => (
              <li key={c._id}>
                <button
                  className={`flex w-full justify-between rounded px-2 py-1.5 text-left ${params.get("categorie") === c.slug ? "bg-ink text-white" : "hover:bg-steel"}`}
                  onClick={() => set({ categorie: c.slug })}
                >
                  <span>{c.name}</span>
                  <span className="tabular-nums opacity-60">{c.productCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      {!lockedBrand && brands?.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-semibold">Marque</legend>
          <ul className="space-y-1">
            {brands.map((b) => {
              const checked = selectedBrands.includes(b.slug);
              return (
                <li key={b._id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-steel">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-deep"
                      checked={checked}
                      onChange={() => {
                        const next = checked ? selectedBrands.filter((s) => s !== b.slug) : [...selectedBrands, b.slug];
                        set({ marque: next.join(",") || null });
                      }}
                    />
                    <span>{b.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 font-semibold">Prix (DA)</legend>
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set({ min: min || null, max: max || null });
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Prix minimum</span>
            <input className="input py-2" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="flex-1">
            <span className="sr-only">Prix maximum</span>
            <input className="input py-2" inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
          </label>
          <button className="btn-secondary px-3 py-2">OK</button>
        </form>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-deep"
          checked={params.get("stock") === "1"}
          onChange={(e) => set({ stock: e.target.checked ? "1" : null })}
        />
        <span>En stock uniquement</span>
      </label>
    </div>
  );
}

/**
 * Catalogue unique utilisé pour : /produits, /gros-menagers, /petits-menagers,
 * /promotions, /categorie/:slug et /marque/:slug
 */
export default function Catalog({ group, promo = false }) {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const isCategory = pathname.startsWith("/categorie/");
  const isBrand = pathname.startsWith("/marque/");

  const { data: categories } = useApi("/categories");
  const { data: brands } = useApi("/brands");

  const category = isCategory ? categories?.find((c) => c.slug === slug) : null;
  const brand = isBrand ? brands?.find((b) => b.slug === slug) : null;
  const effectiveGroup = group || category?.group;

  const set = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ ...changes, page: changes.page ?? null }).forEach(([k, v]) => (v === null || v === "" ? next.delete(k) : next.set(k, v)));
    setParams(next);
    setDrawer(false);
  };

  const apiUrl = useMemo(() => {
    const q = new URLSearchParams({ limit: "12", page: params.get("page") || "1", sort: params.get("tri") || "newest" });
    if (group) q.set("group", group);
    if (promo) q.set("promo", "true");
    if (params.get("q")) q.set("search", params.get("q"));
    const cat = isCategory ? slug : params.get("categorie");
    if (cat) q.set("category", cat);
    const br = isBrand ? slug : params.get("marque");
    if (br) q.set("brand", br);
    if (params.get("min")) q.set("minPrice", params.get("min"));
    if (params.get("max")) q.set("maxPrice", params.get("max"));
    if (params.get("stock") === "1") q.set("inStock", "true");
    return `/products?${q}`;
  }, [params, group, promo, slug, isCategory, isBrand]);

  const { data, loading, error, reload } = useApi(apiUrl);

  const title = promo
    ? "Promotions"
    : group
      ? GROUPS[group].label
      : category?.name || brand?.name || (params.get("q") ? `Résultats pour « ${params.get("q")} »` : "Tous les produits");
  usePageTitle(title);

  const crumbs = [{ to: "/", label: "Accueil" }];
  if (category) crumbs.push({ to: GROUPS[category.group].path, label: GROUPS[category.group].label });
  if (brand) crumbs.push({ to: "/marques", label: "Marques" });
  crumbs.push({ label: title });

  const hasFilters = ["categorie", "marque", "min", "max", "stock", "q"].some((k) => params.get(k));
  const filterProps = { params, set, categories, brands, lockedCategory: isCategory, lockedBrand: isBrand, group: effectiveGroup };

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={crumbs} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">{title}</h1>
          {data && (
            <p className="mt-1 text-ink-muted">
              {data.total} produit{data.total > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary lg:hidden" onClick={() => setDrawer(true)}>
            <IoOptionsOutline className="h-5 w-5" aria-hidden /> Filtres
          </button>
          <label className="flex items-center gap-2">
            <span className="hidden text-sm text-ink-muted sm:inline">Trier par</span>
            <select className="input w-auto py-2" value={params.get("tri") || "newest"} onChange={(e) => set({ tri: e.target.value })}>
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filtres">
          <Filters {...filterProps} />
          {hasFilters && (
            <button className="mt-6 text-sm font-semibold text-brand-deep underline" onClick={() => setParams(new URLSearchParams())}>
              Effacer les filtres
            </button>
          )}
        </aside>

        <div>
          {loading && !data ? (
            <Spinner />
          ) : error ? (
            <ErrorBox message={error} onRetry={reload} />
          ) : data.items.length === 0 ? (
            <EmptyState
              title="Aucun produit ne correspond"
              action={
                hasFilters ? (
                  <button className="btn-primary" onClick={() => setParams(new URLSearchParams())}>
                    Effacer les filtres
                  </button>
                ) : (
                  <Link to="/produits" className="btn-primary">
                    Voir tout le catalogue
                  </Link>
                )
              }
            >
              Essayez un autre mot-clé, une autre marque ou élargissez la fourchette de prix.
            </EmptyState>
          ) : (
            <>
              <div className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
                {data.items.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <Pagination
                page={data.page}
                pages={data.pages}
                onChange={(p) => {
                  set({ page: String(p) });
                  window.scrollTo({ top: 0 });
                }}
              />
            </>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtres">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-paper">
            <div className="flex items-center justify-between border-b border-steel bg-white px-4 py-4">
              <h2 className="text-2xl">Filtres</h2>
              <button onClick={() => setDrawer(false)} aria-label="Fermer les filtres">
                <IoClose className="h-7 w-7" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <Filters {...filterProps} />
            </div>
            {hasFilters && (
              <div className="border-t border-steel bg-white p-4">
                <button className="btn-secondary w-full" onClick={() => { setParams(new URLSearchParams()); setDrawer(false); }}>
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
