import { Link, useParams, useSearchParams } from "react-router-dom";
import { IoCheckmarkCircle } from "react-icons/io5";
import useApi from "../lib/useApi";
import OrderView from "./OrderView";
import { EmptyState, ErrorBox, Spinner } from "../components/ui";
import { usePageTitle } from "../components/Layout";

export default function Order() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data: order, loading, error, status, reload } = useApi(`/orders/${id}`);
  usePageTitle(order ? `Commande ${order.orderNumber}` : "Commande");

  if (loading) return <Spinner label="Vérification de la commande…" />;
  if (status === 404)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState title="Commande introuvable" action={<Link to="/suivi" className="btn-primary">Suivre une commande</Link>}>
          Connectez-vous à votre compte, ou utilisez votre numéro de commande et votre téléphone.
        </EmptyState>
      </div>
    );
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorBox message={error} onRetry={reload} /></div>;

  const isNew = params.get("nouvelle") === "1";
  const paid = order.paymentStatus === "paid";
  const payReturn = params.get("paiement");
  const payFailed = order.paymentMethod === "online" && (order.paymentStatus === "failed" || payReturn === "echec") && !paid;
  const payPending = order.paymentMethod === "online" && order.paymentStatus === "pending";

  let heading = "Votre commande";
  let message = null;
  if (payFailed) {
    heading = "Le paiement n'a pas abouti";
    message = "Aucun montant n'a été débité. Votre panier a été libéré : vous pouvez repasser commande avec le paiement à la livraison.";
  } else if (payPending) {
    heading = "Paiement en attente";
    message = "Nous attendons la confirmation de Chargily. Cette page se met à jour en la rechargeant.";
  } else if (isNew || (payReturn === "retour" && paid)) {
    heading = "Merci, votre commande est enregistrée";
    message = paid
      ? "Votre paiement est confirmé. Nous vous appelons pour organiser la livraison."
      : "Nous vous appelons dans les prochaines heures pour la confirmer. Gardez votre numéro de commande pour la suivre.";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <div className="mb-6 flex items-start gap-3">
        {!payFailed && !payPending && (isNew || payReturn) && <IoCheckmarkCircle className="mt-1 h-9 w-9 shrink-0 text-brand" aria-hidden />}
        <div>
          <h1 className="text-4xl">{heading}</h1>
          {message && <p className="mt-2 max-w-prose text-ink-muted">{message}</p>}
        </div>
      </div>
      <OrderView
        order={order}
        actions={
          <>
            {payPending && order.checkoutUrl && (
              <a href={order.checkoutUrl} className="btn-primary">
                Reprendre le paiement
              </a>
            )}
            {payPending && (
              <button className="btn-secondary" onClick={reload}>
                Actualiser
              </button>
            )}
            <Link to="/produits" className="btn-secondary">
              Continuer mes achats
            </Link>
          </>
        }
      />
    </div>
  );
}
