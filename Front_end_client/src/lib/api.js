import axios from "axios";

// En production sur Vercel, /api est redirigé vers l'API (même domaine → cookies fiables).
// VITE_API_URL permet de pointer ailleurs si besoin.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 20000,
});

export const errorMessage = (err, fallback = "Une erreur est survenue. Réessayez.") => {
  if (!err?.response) return "Connexion au serveur impossible. Vérifiez votre connexion internet.";
  return err.response.data?.message || fallback;
};

// Regroupe les erreurs de champ renvoyées par l'API : { "customer.phone": "..." }
export const fieldErrors = (err) =>
  Object.fromEntries((err?.response?.data?.details || []).map((d) => [d.field, d.message]));

// Les images locales (dev) sont servies par l'API via /uploads
export const imageUrl = (url) => url || "";
