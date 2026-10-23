import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import useApi from "../lib/useApi";
import { ErrorBox, Pagination, Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";
import { AdminHeader } from "./AdminLayout";
import { formatDate } from "../lib/format";

export default function Users() {
  usePageTitle("Clients");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const q = new URLSearchParams({ page: params.get("page") || "1" });
  if (params.get("q")) q.set("search", params.get("q"));
  const { data, loading, error, reload } = useApi(`/admin/users?${q}`);

  return (
    <div>
      <AdminHeader title="Clients" />
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(search.trim() ? { q: search.trim() } : {});
        }}
      >
        <label htmlFor="usearch" className="sr-only">
          Rechercher un client
        </label>
        <input id="usearch" className="input max-w-sm py-2" placeholder="Nom, email, téléphone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-secondary py-2">Rechercher</button>
      </form>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-steel text-sm text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Inscrit le</th>
                <th className="px-4 py-3 font-medium">Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel">
              {data.items.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 tabular-nums">{u.phone || "—"}</td>
                  <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.role === "admin" ? "Admin" : "Client"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={(p) => setParams({ ...Object.fromEntries(params), page: String(p) })} />}
    </div>
  );
}
