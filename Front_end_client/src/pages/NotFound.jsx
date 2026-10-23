import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui";
import { usePageTitle } from "../components/Layout";

export default function NotFound() {
  usePageTitle("Page introuvable");
  return (
    <div className="mx-auto max-w-shop px-4 py-10">
      <EmptyState title="Cette page n'existe pas" action={<Link to="/" className="btn-primary">Retour à l'accueil</Link>}>
        Le lien est peut-être ancien. Utilisez la recherche ou parcourez les rayons.
      </EmptyState>
    </div>
  );
}
