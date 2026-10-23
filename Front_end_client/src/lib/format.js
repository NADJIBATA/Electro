const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export const formatDA = (n) => `${nf.format(Number(n) || 0)} DA`;

export const formatDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export const formatDateTime = (d) =>
  new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const discount = (price, oldPrice) =>
  oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

export const STATUS = {
  pending: { label: "En attente", tone: "bg-star-soft text-ink" },
  confirmed: { label: "Confirmée", tone: "bg-brand-soft text-brand-deep" },
  shipped: { label: "Expédiée", tone: "bg-sky-100 text-sky-900" },
  delivered: { label: "Livrée", tone: "bg-brand-deep text-white" },
  cancelled: { label: "Annulée", tone: "bg-steel text-ink-muted" },
};

export const PAYMENT_STATUS = {
  unpaid: "Non payée",
  pending: "Paiement en cours",
  paid: "Payée",
  failed: "Paiement échoué",
  refunded: "Remboursée",
};

export const PAYMENT_METHOD = { cod: "À la livraison", online: "En ligne (CIB / Edahabia)" };

export const GROUPS = {
  "gros-menagers": { label: "Gros ménagers", path: "/gros-menagers" },
  "petits-menagers": { label: "Petits ménagers", path: "/petits-menagers" },
};
