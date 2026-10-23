# WebStar Electro

Boutique en ligne d'électroménager pour l'Algérie : catalogue gros et petits ménagers, panier, commande avec livraison dans les 69 wilayas, paiement à la livraison ou en ligne (CIB / Edahabia via Chargily Pay), comptes clients et panneau d'administration.

| Dossier | Contenu |
| --- | --- |
| `Backend/` | API REST : Node.js, Express, MongoDB (Mongoose) |
| `Front_end_client/` | Site : React 18, Vite, Tailwind CSS |

## Fonctionnalités

**Boutique**
- Accueil par rayons, promotions, meilleures ventes, marques
- Catalogue : recherche, filtres par catégorie, marque, prix et stock, tri et pagination
- Fiche produit avec photos, caractéristiques et produits similaires
- Panier conservé dans le navigateur
- Commande sans compte ou avec compte, choix de la wilaya (69) et de la commune
- Paiement à la livraison, ou en ligne par Chargily Pay si la clé est configurée
- Page de confirmation et suivi de commande par numéro + téléphone
- Compte client : historique, annulation d'une commande en attente, adresse par défaut, mot de passe

**Administration** (`/admin`)
- Tableau de bord : commandes à confirmer, chiffre d'affaires, stock faible
- Commandes : filtres par statut, recherche, cycle *en attente → confirmée → expédiée → livrée*, annulation avec remise en stock, notes internes, suivi des paiements
- Produits (jusqu'à 6 photos), catégories, marques, clients

**Fiabilité**
- Les prix sont toujours relus en base : le client ne peut pas les modifier
- Stock réservé de façon atomique : deux clients ne peuvent pas acheter le dernier article
- Les paiements en ligne abandonnés sont annulés au bout d'une heure et le stock est libéré
- Webhook Chargily vérifié par signature, traitement idempotent
- Emails : nouvelle commande (admin + client), changement de statut, paiement reçu
- Sécurité : cookies httpOnly, mots de passe bcrypt, helmet, CORS, limitation de débit, protection contre l'injection NoSQL
- 38 tests d'intégration exécutés à chaque push (GitHub Actions)

## Lancer le projet en local

Prérequis : Node.js 20+ et MongoDB (local ou Atlas).

```bash
# 1. API
cd Backend
cp .env.example .env        # puis remplir au minimum JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed                # optionnel : 22 produits de démonstration
npm run dev                 # http://localhost:3000

# 2. Site (dans un autre terminal)
cd Front_end_client
npm install
npm run dev                 # http://localhost:5173
```

Le compte admin défini par `ADMIN_EMAIL` / `ADMIN_PASSWORD` est créé au premier démarrage. Connectez-vous sur `/connexion` : vous êtes redirigé vers `/admin`.

Sans Cloudinary, les photos sont enregistrées dans `Backend/uploads/` (développement uniquement). Sans SMTP, les emails sont affichés dans la console.

### Tests

```bash
cd Backend
npm test        # nécessite MongoDB sur 127.0.0.1:27017 (ou MONGODB_URI_TEST)
```

## Mise en production

Architecture recommandée, gratuite pour démarrer :

```
Navigateur ──> Vercel (site)  ──/api──>  Render (API)  ──>  MongoDB Atlas
                                              │
                                              ├──> Cloudinary (photos)
                                              ├──> Chargily Pay (paiement)
                                              └──> SMTP Brevo (emails)
```

Le site appelle l'API via `/api` sur son propre domaine (réécriture Vercel). Les cookies de connexion restent ainsi sur le même domaine, ce qui évite les blocages de cookies tiers dans Safari et Chrome.

### 1. MongoDB Atlas
1. Créez un cluster gratuit (M0) sur [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. *Database Access* : créez un utilisateur et un mot de passe.
3. *Network Access* : autorisez `0.0.0.0/0`, car Render n'a pas d'IP fixe en offre gratuite.
4. Copiez la chaîne de connexion `mongodb+srv://…/electro`.

### 2. Cloudinary
⚠️ **D'abord, régénérez votre secret API Cloudinary** (*Settings → API Keys*). L'ancien a été publié dans l'historique git de ce dépôt.
Notez ensuite le *cloud name*, la clé et le nouveau secret.

### 3. API sur Render
1. Sur [render.com](https://render.com) : *New → Blueprint*, puis choisissez ce dépôt. Le fichier `render.yaml` est détecté.
2. Renseignez les variables demandées :
   - `MONGODB_URI` : la chaîne Atlas
   - `CLIENT_URL` : l'URL Vercel du site, par exemple `https://webstar-electro.vercel.app` (vous pourrez la corriger après l'étape 4)
   - `API_PUBLIC_URL` : `https://electro-api.onrender.com`, l'URL que Render affiche pour le service
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` : le compte administrateur, avec un mot de passe solide
   - les clés Cloudinary
   - `CHARGILY_SECRET_KEY` et `SMTP_*` : facultatifs, voir plus bas
3. Vérifiez que `https://<votre-api>.onrender.com/api/health` répond `{"status":"ok"}`.

> En offre gratuite, Render met l'API en veille après 15 minutes sans visite. La première requête suivante prend alors environ 30 à 60 secondes. Passez au plan *Starter* pour une boutique en activité.

### 4. Site sur Vercel
1. Dans `Front_end_client/vercel.json`, remplacez `electro-api.onrender.com` par l'adresse de votre API Render, puis commitez.
2. Sur [vercel.com](https://vercel.com) : *Add New → Project*, choisissez ce dépôt et réglez **Root Directory** sur `Front_end_client`. Le framework Vite est détecté.
3. Déployez, puis reportez l'URL obtenue (ou votre domaine) dans `CLIENT_URL` sur Render.

### 5. Paiement en ligne (Chargily Pay)
1. Créez un compte sur [chargily.com](https://chargily.com) et récupérez la **clé secrète de test**.
2. Sur Render, renseignez `CHARGILY_SECRET_KEY` avec cette clé et laissez `CHARGILY_MODE=test`.
3. Le webhook est envoyé automatiquement avec chaque paiement vers `API_PUBLIC_URL/api/payments/chargily/webhook` : rien à configurer côté Chargily.
4. Faites une commande test. Quand tout fonctionne, passez à la clé *live* avec `CHARGILY_MODE=live`.

Sans clé Chargily, le paiement en ligne est simplement masqué et seul le paiement à la livraison est proposé.

### 6. Emails (facultatif)
Avec [Brevo](https://www.brevo.com) (300 emails par jour gratuits), dans *SMTP & API* :
`SMTP_HOST=smtp-relay.brevo.com`, `SMTP_PORT=587`, `SMTP_USER` et `SMTP_PASS` fournis par Brevo, et `MAIL_FROM` avec une adresse d'expéditeur validée.

### 7. Après la mise en ligne
- Connectez-vous avec le compte admin, créez vos catégories, marques et produits avec leurs photos.
- Ne lancez **pas** `npm run seed` en production : il ajoute des produits de démonstration.
- Pour un autre administrateur : `npm run create-admin -- email@domaine.dz MotDePasse` depuis le *Shell* Render (offre payante), ou en local avec `MONGODB_URI` pointant vers Atlas.

## Variables d'environnement

Toutes sont documentées dans [`Backend/.env.example`](Backend/.env.example). En production, l'API refuse de démarrer sans `MONGODB_URI`, `CLIENT_URL` et un `JWT_SECRET` d'au moins 32 caractères.

## API (résumé)

| Méthode | Route | Accès |
| --- | --- | --- |
| GET | `/api/products` (`search`, `category`, `brand`, `group`, `minPrice`, `maxPrice`, `inStock`, `promo`, `sort`, `page`) | public |
| GET | `/api/products/:slug` | public |
| GET | `/api/categories`, `/api/brands`, `/api/meta/wilayas`, `/api/meta/config` | public |
| POST | `/api/orders` | public |
| GET | `/api/orders/track?number=&phone=` | public |
| GET | `/api/orders/mine` · POST `/api/orders/:id/cancel` | client |
| POST | `/api/auth/register` · `/login` · `/logout` · GET/PATCH `/api/auth/me` | — |
| POST/PATCH/DELETE | `/api/products`, `/api/categories`, `/api/brands` | admin |
| GET/PATCH | `/api/admin/stats`, `/api/admin/orders…`, `/api/admin/users` | admin |
| POST | `/api/payments/chargily/webhook` | Chargily (signé) |
