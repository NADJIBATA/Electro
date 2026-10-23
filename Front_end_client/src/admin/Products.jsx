import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { IoAdd, IoClose } from "react-icons/io5";
import useApi from "../lib/useApi";
import { api, errorMessage, fieldErrors } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { ErrorBox, Pagination, Spinner } from "../components/ui";
import ProductImage from "../components/ProductImage";
import { usePageTitle } from "../components/Layout";
import { AdminHeader } from "./AdminLayout";
import { GROUPS, formatDA } from "../lib/format";

export function ProductsList() {
  usePageTitle("Produits");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const q = new URLSearchParams({ includeInactive: "true", limit: "20", page: params.get("page") || "1", sort: "newest" });
  if (params.get("q")) q.set("search", params.get("q"));
  const { data, loading, error, reload } = useApi(`/products?${q}`);

  return (
    <div>
      <AdminHeader title="Produits">
        <Link to="/admin/produits/nouveau" className="btn-primary">
          <IoAdd className="h-5 w-5" aria-hidden /> Ajouter un produit
        </Link>
      </AdminHeader>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(search.trim() ? { q: search.trim() } : {});
        }}
      >
        <label htmlFor="psearch" className="sr-only">
          Rechercher un produit
        </label>
        <input id="psearch" className="input max-w-sm py-2" placeholder="Nom du produit" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-secondary py-2">Rechercher</button>
      </form>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <p className="panel p-6 text-ink-muted">
          Aucun produit. <Link to="/admin/produits/nouveau" className="font-semibold text-brand-deep underline">Ajoutez le premier.</Link>
        </p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-steel text-sm text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 text-right font-medium">Prix</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">En vente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel">
              {data.items.map((p) => (
                <tr key={p._id} className="hover:bg-paper">
                  <td className="px-4 py-2">
                    <Link to={`/admin/produits/${p._id}`} className="flex items-center gap-3 font-medium hover:underline">
                      <span className="h-12 w-12 shrink-0 rounded border border-steel bg-white p-1">
                        <ProductImage src={p.images?.[0]?.url} alt="" hint={p.category?.name || p.name} />
                      </span>
                      <span>
                        {p.name}
                        <span className="block text-sm font-normal text-ink-muted">{p.brand?.name}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p.category?.name}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatDA(p.price)}</td>
                  <td className={`px-4 py-2 text-right font-semibold tabular-nums ${p.stock === 0 ? "text-danger" : p.stock <= 3 ? "text-ink" : "text-ink-muted"}`}>{p.stock}</td>
                  <td className="px-4 py-2">{p.isActive ? "Oui" : <span className="text-ink-muted">Masqué</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && (
        <Pagination
          page={data.page}
          pages={data.pages}
          onChange={(p) => {
            const next = new URLSearchParams(params);
            next.set("page", String(p));
            setParams(next);
          }}
        />
      )}
    </div>
  );
}

const EMPTY = { name: "", description: "", price: "", oldPrice: "", stock: "", brand: "", category: "", characteristics: "", featured: false, isActive: true };

export function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "nouveau";
  const navigate = useNavigate();
  const toast = useToast();
  const { data: brands } = useApi("/brands");
  const { data: categories } = useApi("/categories");
  const { data: existing, loading } = useApi(isNew ? null : `/products/${id}`);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]); // images déjà enregistrées
  const [files, setFiles] = useState([]); // nouveaux fichiers
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  usePageTitle(isNew ? "Nouveau produit" : existing?.product?.name);

  useEffect(() => {
    if (!existing) return;
    const p = existing.product;
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : "",
      stock: String(p.stock),
      brand: p.brand?._id || "",
      category: p.category?._id || "",
      characteristics: (p.characteristics || []).join("\n"),
      featured: p.featured,
      isActive: p.isActive,
    });
    setImages(p.images || []);
  }, [existing]);

  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  if (!isNew && loading) return <Spinner />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setErrors({});
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "characteristics") {
        fd.append(k, JSON.stringify(v.split("\n").map((l) => l.trim()).filter(Boolean)));
      } else if (v !== "" || ["description", "oldPrice"].includes(k)) {
        fd.append(k, typeof v === "boolean" ? String(v) : v);
      }
    });
    if (!isNew) fd.append("keepImages", JSON.stringify(images.map((i) => i.publicId || i.url)));
    files.forEach((f) => fd.append("images", f));
    try {
      const { data } = isNew ? await api.post("/products", fd) : await api.patch(`/products/${id}`, fd);
      toast(isNew ? "Produit ajouté." : "Produit enregistré.");
      setFiles([]);
      navigate(`/admin/produits/${data._id}`, { replace: true });
      if (!isNew) setImages(data.images);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Supprimer définitivement « ${form.name} » ? Pour le retirer temporairement, décochez plutôt « En vente ».`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast("Produit supprimé.");
      navigate("/admin/produits");
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const err = (k) => errors[k] && <p className="mt-1 text-sm text-danger">{errors[k]}</p>;
  const groups = Object.entries(GROUPS);

  return (
    <form onSubmit={submit} className="max-w-4xl" noValidate>
      <Link to="/admin/produits" className="text-sm font-semibold text-brand-deep hover:underline">
        Tous les produits
      </Link>
      <AdminHeader title={isNew ? "Nouveau produit" : "Modifier le produit"}>
        {!isNew && existing?.product?.isActive && (
          <Link to={`/produit/${existing.product.slug}`} className="btn-secondary" target="_blank">
            Voir sur la boutique
          </Link>
        )}
      </AdminHeader>

      {error && (
        <p className="mb-4 rounded-md border border-danger/30 bg-white p-4 text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <section className="panel space-y-4 p-5">
            <div>
              <label className="label" htmlFor="name">
                Nom
              </label>
              <input id="name" className="input" value={form.name} onChange={set("name")} required />
              {err("name")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="brand">
                  Marque
                </label>
                <select id="brand" className="input" value={form.brand} onChange={set("brand")} required>
                  <option value="">Choisir…</option>
                  {(brands || []).map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {err("brand")}
              </div>
              <div>
                <label className="label" htmlFor="category">
                  Catégorie
                </label>
                <select id="category" className="input" value={form.category} onChange={set("category")} required>
                  <option value="">Choisir…</option>
                  {groups.map(([g, meta]) => (
                    <optgroup key={g} label={meta.label}>
                      {(categories || [])
                        .filter((c) => c.group === g)
                        .map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                {err("category")}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="characteristics">
                Caractéristiques
              </label>
              <textarea id="characteristics" className="input min-h-32 font-mono text-sm" value={form.characteristics} onChange={set("characteristics")} placeholder={"Capacité : 430 L\nClasse énergétique : A+\nCouleur : Inox"} />
              <p className="mt-1 text-sm text-ink-muted">Une par ligne, au format « Nom : valeur ».</p>
            </div>
            <div>
              <label className="label" htmlFor="description">
                Description
              </label>
              <textarea id="description" className="input min-h-28" value={form.description} onChange={set("description")} />
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="mb-1 text-2xl">Photos</h2>
            <p className="mb-4 text-sm text-ink-muted">La première photo sert de vignette. JPG, PNG ou WEBP, 5 Mo maximum.</p>
            <ul className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <li key={img.url} className="relative h-28 w-28 rounded-md border border-steel bg-white p-1">
                  <ProductImage src={img.url} alt={`Photo ${i + 1}`} />
                  <button type="button" onClick={() => setImages((all) => all.filter((x) => x !== img))} className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-white" aria-label={`Retirer la photo ${i + 1}`}>
                    <IoClose />
                  </button>
                </li>
              ))}
              {previews.map((p, i) => (
                <li key={p.url} className="relative h-28 w-28 rounded-md border-2 border-dashed border-brand bg-white p-1">
                  <img src={p.url} alt={`Nouvelle photo ${i + 1}`} className="h-full w-full object-contain" />
                  <button type="button" onClick={() => setFiles((all) => all.filter((f) => f !== p.file))} className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-white" aria-label={`Retirer la nouvelle photo ${i + 1}`}>
                    <IoClose />
                  </button>
                </li>
              ))}
              {images.length + files.length < 6 && (
                <li>
                  <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-steel-dark text-sm text-ink-muted hover:border-ink hover:text-ink">
                    <IoAdd className="h-6 w-6" aria-hidden />
                    Ajouter
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      onChange={(e) => {
                        // Copier la liste AVANT de vider l'input : sinon React lit une liste vide
                        const picked = Array.from(e.target.files || []);
                        e.target.value = "";
                        setFiles((all) => [...all, ...picked].slice(0, 6 - images.length));
                      }}
                    />
                  </label>
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel space-y-4 p-5">
            <div>
              <label className="label" htmlFor="price">
                Prix (DA)
              </label>
              <input id="price" className="input tabular-nums" inputMode="numeric" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, "") }))} required />
              {err("price")}
            </div>
            <div>
              <label className="label" htmlFor="oldPrice">
                Ancien prix (promo)
              </label>
              <input id="oldPrice" className="input tabular-nums" inputMode="numeric" value={form.oldPrice} onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value.replace(/\D/g, "") }))} />
              <p className="mt-1 text-sm text-ink-muted">Affiché barré s'il est supérieur au prix.</p>
            </div>
            <div>
              <label className="label" htmlFor="stock">
                Stock
              </label>
              <input id="stock" className="input tabular-nums" inputMode="numeric" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value.replace(/\D/g, "") }))} required />
              {err("stock")}
            </div>
          </section>
          <section className="panel space-y-3 p-5">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-deep" checked={form.isActive} onChange={set("isActive")} />
              En vente sur la boutique
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 accent-brand-deep" checked={form.featured} onChange={set("featured")} />
              Mis en avant sur l'accueil
            </label>
          </section>
          <button className="btn-primary w-full py-3" disabled={saving}>
            {saving ? "Enregistrement…" : isNew ? "Ajouter le produit" : "Enregistrer"}
          </button>
          {!isNew && (
            <button type="button" className="btn-danger w-full" onClick={remove}>
              Supprimer le produit
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
