import { Link } from "react-router-dom";
import { BiLogoFacebookSquare } from "react-icons/bi";
import { FaInstagram } from "react-icons/fa6";
import useApi from "../lib/useApi";

export default function Footer() {
  const { data: config } = useApi("/meta/config");
  return (
    <footer className="mt-16 bg-ink text-white/80">
      <div className="mx-auto grid max-w-shop gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-cond text-2xl font-semibold text-white">WebStar Electro</p>
          <p className="mt-2 max-w-xs text-sm">Électroménager neuf, garanti, livré dans les 69 wilayas.</p>
          <div className="mt-4 flex gap-3">
            <a href="https://web.facebook.com/nadjib.ath.28" target="_blank" rel="noreferrer" className="hover:text-white" aria-label="Facebook">
              <BiLogoFacebookSquare className="h-7 w-7" />
            </a>
            <a href="https://www.instagram.com/nadjib__atamnia/" target="_blank" rel="noreferrer" className="hover:text-white" aria-label="Instagram">
              <FaInstagram className="h-7 w-7" />
            </a>
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-base font-semibold text-white">Rayons</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/gros-menagers">Gros ménagers</Link></li>
            <li><Link className="hover:text-white" to="/petits-menagers">Petits ménagers</Link></li>
            <li><Link className="hover:text-white" to="/marques">Marques</Link></li>
            <li><Link className="hover:text-white" to="/promotions">Promotions</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-base font-semibold text-white">Votre commande</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/suivi">Suivre ma commande</Link></li>
            <li><Link className="hover:text-white" to="/compte">Mon compte</Link></li>
            <li><Link className="hover:text-white" to="/panier">Mon panier</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-base font-semibold text-white">Paiement</h2>
          <p className="text-sm">
            {config?.paymentMethods?.online ? "À la livraison, en espèces, ou en ligne par carte CIB et Edahabia." : "En espèces, à la livraison."}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">© {new Date().getFullYear()} WebStar Electro</div>
    </footer>
  );
}
