import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { IoCartOutline, IoPersonOutline, IoSearch, IoMenu, IoClose } from "react-icons/io5";
import logo from "../assets/WebStarLogo.png";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/gros-menagers", label: "Gros ménagers" },
  { to: "/petits-menagers", label: "Petits ménagers" },
  { to: "/marques", label: "Marques" },
  { to: "/promotions", label: "Promotions" },
  { to: "/produits", label: "Tous les produits" },
];

function SearchBox({ className = "", onDone }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [q, setQ] = useState(new URLSearchParams(search).get("q") || "");
  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        navigate(q.trim() ? `/produits?q=${encodeURIComponent(q.trim())}` : "/produits");
        onDone?.();
      }}
    >
      <label htmlFor="search" className="sr-only">
        Rechercher un produit
      </label>
      <input
        id="search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Réfrigérateur, machine à laver, Condor…"
        className="h-11 w-full rounded-md border-0 bg-white pl-4 pr-12 text-ink placeholder:text-ink-muted/80 focus:outline-none focus:ring-2 focus:ring-star"
      />
      <button type="submit" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink" aria-label="Rechercher">
        <IoSearch className="h-5 w-5" />
      </button>
    </form>
  );
}

export default function Header() {
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const account = user ? (isAdmin ? "/admin" : "/compte") : "/connexion";

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand">
        <div className="mx-auto flex max-w-shop items-center gap-3 px-4 py-3 sm:gap-6">
          <button className="text-white lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            <IoMenu className="h-7 w-7" />
          </button>
          <Link to="/" className="shrink-0" aria-label="WebStar Electro, accueil">
            <img src={logo} alt="WebStar Electro" className="h-5 w-auto sm:h-6" width="512" height="46" />
          </Link>
          <SearchBox className="hidden flex-1 md:block" />
          <nav className="ml-auto flex items-center gap-1 text-white md:ml-0" aria-label="Compte et panier">
            <Link to={account} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/10">
              <IoPersonOutline className="h-6 w-6" aria-hidden />
              <span className="hidden text-sm font-medium lg:inline">{user ? (isAdmin ? "Administration" : user.firstName) : "Se connecter"}</span>
              <span className="sr-only lg:hidden">{user ? "Mon compte" : "Se connecter"}</span>
            </Link>
            <Link to="/panier" className="relative flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/10">
              <IoCartOutline className="h-6 w-6" aria-hidden />
              <span className="hidden text-sm font-medium lg:inline">Panier</span>
              <span className="sr-only">, {count} article{count > 1 ? "s" : ""}</span>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-star px-1 text-xs font-bold text-ink lg:static" aria-hidden>
                  {count}
                </span>
              )}
            </Link>
          </nav>
        </div>
        <div className="px-4 pb-3 md:hidden">
          <SearchBox />
        </div>
      </div>
      <nav className="hidden border-b border-brand-deep bg-brand-deep lg:block" aria-label="Rayons">
        <ul className="mx-auto flex max-w-shop gap-1 px-4">
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink
                to={n.to}
                className={({ isActive }) =>
                  `block px-3 py-2.5 text-[15px] font-medium text-white ${isActive ? "bg-black/25" : "hover:bg-black/15"}`
                }
              >
                {n.label}
              </NavLink>
            </li>
          ))}
          <li className="ml-auto">
            <NavLink to="/suivi" className="block px-3 py-2.5 text-[15px] text-white/90 hover:text-white">
              Suivre ma commande
            </NavLink>
          </li>
        </ul>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white">
            <div className="flex items-center justify-between bg-brand px-4 py-4">
              <img src={logo} alt="WebStar Electro" className="h-5 w-auto" />
              <button className="text-white" onClick={() => setOpen(false)} aria-label="Fermer le menu">
                <IoClose className="h-7 w-7" />
              </button>
            </div>
            <ul className="flex-1 divide-y divide-steel overflow-y-auto">
              {[{ to: "/", label: "Accueil" }, ...NAV, { to: "/suivi", label: "Suivre ma commande" }, { to: account, label: user ? "Mon compte" : "Se connecter" }].map((n) => (
                <li key={n.to + n.label}>
                  <NavLink to={n.to} end className={({ isActive }) => `block px-5 py-4 text-lg ${isActive ? "font-semibold text-brand-deep" : ""}`}>
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
