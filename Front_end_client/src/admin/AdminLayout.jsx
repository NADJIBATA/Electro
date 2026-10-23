import { NavLink, Outlet, Link } from "react-router-dom";
import { IoGridOutline, IoReceiptOutline, IoCubeOutline, IoPricetagsOutline, IoRibbonOutline, IoPeopleOutline, IoStorefrontOutline, IoLogOutOutline } from "react-icons/io5";
import logo from "../assets/WebStarLogo.png";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/admin", label: "Tableau de bord", icon: IoGridOutline, end: true },
  { to: "/admin/commandes", label: "Commandes", icon: IoReceiptOutline },
  { to: "/admin/produits", label: "Produits", icon: IoCubeOutline },
  { to: "/admin/categories", label: "Catégories", icon: IoPricetagsOutline },
  { to: "/admin/marques", label: "Marques", icon: IoRibbonOutline },
  { to: "/admin/clients", label: "Clients", icon: IoPeopleOutline },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <Link to="/admin" className="block">
            <img src={logo} alt="WebStar Electro" className="h-4 w-auto" />
            <span className="mt-1 hidden text-xs text-white/60 lg:block">Administration</span>
          </Link>
        </div>
        <nav aria-label="Administration" className="overflow-x-auto">
          <ul className="flex gap-1 px-2 pb-2 lg:flex-col lg:px-2">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-[15px] ${isActive ? "bg-brand-deep font-semibold" : "text-white/80 hover:bg-white/10 hover:text-white"}`
                  }
                >
                  <l.icon className="h-5 w-5 shrink-0" aria-hidden />
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden border-t border-white/10 px-2 py-3 lg:absolute lg:inset-x-0 lg:bottom-0 lg:block">
          <p className="truncate px-3 pb-2 text-xs text-white/50">{user?.email}</p>
          <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-white/80 hover:bg-white/10">
            <IoStorefrontOutline className="h-5 w-5" aria-hidden /> Voir la boutique
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-white/80 hover:bg-white/10">
            <IoLogOutOutline className="h-5 w-5" aria-hidden /> Se déconnecter
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminHeader({ title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-4xl">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
