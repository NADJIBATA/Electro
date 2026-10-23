// Gestion des marques et des catégories (même écran)
import { useState } from "react";
import useApi from "../lib/useApi";
import { api, errorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { ErrorBox, Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";
import { AdminHeader } from "./AdminLayout";
import { GROUPS } from "../lib/format";

function ItemForm({ kind, item, onDone, onCancel }) {
  const toast = useToast();
  const imageKey = kind === "brands" ? "logo" : "image";
  const [name, setName] = useState(item?.name || "");
  const [group, setGroup] = useState(item?.group || "gros-menagers");
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData();
    fd.append("name", name);
    if (kind === "categories") fd.append("group", group);
    if (file) fd.append("image", file);
    if (removeImage && !file) fd.append("removeImage", "true");
    try {
      if (item) await api.patch(`/${kind}/${item._id}`, fd);
      else await api.post(`/${kind}`, fd);
      toast(item ? "Modifications enregistrées." : kind === "brands" ? "Marque ajoutée." : "Catégorie ajoutée.");
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-md bg-paper p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor={`name-${item?._id || "new"}`}>
            Nom
          </label>
          <input id={`name-${item?._id || "new"}`} className="input py-2" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        {kind === "categories" && (
          <div>
            <label className="label" htmlFor={`group-${item?._id || "new"}`}>
              Rayon
            </label>
            <select id={`group-${item?._id || "new"}`} className="input py-2" value={group} onChange={(e) => setGroup(e.target.value)}>
              {Object.entries(GROUPS).map(([g, m]) => (
                <option key={g} value={g}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor={`img-${item?._id || "new"}`}>
            {kind === "brands" ? "Logo" : "Image"} (facultatif)
          </label>
          <input id={`img-${item?._id || "new"}`} type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={(e) => setFile(e.target.files[0] || null)} />
          {item?.[imageKey] && !file && (
            <label className="mt-1 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> Retirer l'image actuelle
            </label>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary py-2" disabled={saving}>
          {saving ? "…" : item ? "Enregistrer" : "Ajouter"}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary py-2" onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
    </form>
  );
}

export default function Taxonomy({ kind }) {
  const title = kind === "brands" ? "Marques" : "Catégories";
  usePageTitle(title);
  const toast = useToast();
  const { data, loading, error, reload } = useApi(`/${kind}`);
  const [editing, setEditing] = useState(null);
  const imageKey = kind === "brands" ? "logo" : "image";

  const remove = async (item) => {
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    try {
      await api.delete(`/${kind}/${item._id}`);
      toast("Supprimé.");
      reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const rows = (list) => (
    <ul className="divide-y divide-steel">
      {list.map((item) => (
        <li key={item._id} className="px-4 py-3">
          {editing === item._id ? (
            <ItemForm kind={kind} item={item} onDone={() => { setEditing(null); reload(); }} onCancel={() => setEditing(null)} />
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-10 w-16 items-center justify-center">
                {item[imageKey]?.url ? <img src={item[imageKey].url} alt="" className="max-h-10 max-w-16 object-contain" /> : null}
              </span>
              <span className="flex-1 font-medium">{item.name}</span>
              <span className="text-sm text-ink-muted tabular-nums">
                {item.productCount} produit{item.productCount > 1 ? "s" : ""}
              </span>
              <button className="font-semibold text-brand-deep hover:underline" onClick={() => setEditing(item._id)}>
                Modifier
              </button>
              <button
                className="font-semibold text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => remove(item)}
                disabled={item.productCount > 0}
                title={item.productCount > 0 ? "Retirez d'abord les produits associés" : undefined}
              >
                Supprimer
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="max-w-4xl">
      <AdminHeader title={title} />
      <section className="panel mb-6 p-4">
        <h2 className="mb-3 text-2xl">{kind === "brands" ? "Ajouter une marque" : "Ajouter une catégorie"}</h2>
        <ItemForm key={data?.length} kind={kind} onDone={reload} />
      </section>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : kind === "categories" ? (
        Object.entries(GROUPS).map(([g, m]) => (
          <section key={g} className="panel mb-6">
            <h2 className="border-b border-steel px-4 py-3 text-2xl">{m.label}</h2>
            {rows(data.filter((c) => c.group === g))}
          </section>
        ))
      ) : (
        <section className="panel">{rows(data)}</section>
      )}
    </div>
  );
}
