import { Link } from "react-router-dom";
import useApi from "../lib/useApi";
import { Breadcrumbs, ErrorBox, Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";

export default function Brands() {
  usePageTitle("Marques");
  const { data, loading, error, reload } = useApi("/brands");
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ to: "/", label: "Accueil" }, { label: "Marques" }]} />
      <h1 className="mb-6 text-4xl sm:text-5xl">Marques</h1>
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((b) => (
            <li key={b._id}>
              <Link to={`/marque/${b.slug}`} className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-steel bg-white px-4 py-8 text-center hover:border-ink">
                {b.logo?.url ? (
                  <img src={b.logo.url} alt={b.name} className="h-14 w-auto max-w-[140px] object-contain" />
                ) : (
                  <span className="font-cond text-3xl font-semibold">{b.name}</span>
                )}
                <span className="text-sm text-ink-muted">
                  {b.productCount} produit{b.productCount > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
