// Données de démonstration. Usage : npm run seed            (ajoute si la base est vide)
//                                    npm run seed -- --reset  (vide le catalogue d'abord)
const mongoose = require("mongoose");
const { connectDB } = require("../src/config/db");
const Brand = require("../src/models/Brand");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const { slugify } = require("../src/utils/text");

const brands = ["Condor", "Iris", "Brandt", "Samsung", "LG", "Beko", "Moulinex", "Philips"];

const categories = [
  { name: "Réfrigérateurs", group: "gros-menagers" },
  { name: "Machines à laver", group: "gros-menagers" },
  { name: "Cuisinières", group: "gros-menagers" },
  { name: "Climatiseurs", group: "gros-menagers" },
  { name: "Téléviseurs", group: "gros-menagers" },
  { name: "Micro-ondes", group: "petits-menagers" },
  { name: "Aspirateurs", group: "petits-menagers" },
  { name: "Robots de cuisine", group: "petits-menagers" },
  { name: "Cafetières", group: "petits-menagers" },
  { name: "Fers à repasser", group: "petits-menagers" },
];

const products = [
  ["Réfrigérateur No Frost 430 L", "Condor", "Réfrigérateurs", 119900, 129900, 6, ["Capacité : 430 L", "Technologie No Frost", "Classe énergétique A+", "Couleur : Inox"]],
  ["Réfrigérateur combiné 340 L", "Samsung", "Réfrigérateurs", 145000, null, 3, ["Capacité : 340 L", "Compresseur Digital Inverter", "Garantie 10 ans compresseur"]],
  ["Réfrigérateur double porte 250 L", "Iris", "Réfrigérateurs", 68500, null, 10, ["Capacité : 250 L", "Dégivrage manuel", "Classe A"]],
  ["Lave-linge frontal 8 kg", "LG", "Machines à laver", 98900, 104900, 5, ["Capacité : 8 kg", "Moteur Inverter Direct Drive", "1400 tr/min", "Vapeur anti-allergènes"]],
  ["Lave-linge 7 kg", "Beko", "Machines à laver", 72900, null, 8, ["Capacité : 7 kg", "1200 tr/min", "15 programmes"]],
  ["Machine à laver semi-automatique 10 kg", "Condor", "Machines à laver", 38900, null, 12, ["Double cuve", "Capacité : 10 kg", "Essorage 1350 tr/min"]],
  ["Cuisinière 4 feux 60 cm", "Brandt", "Cuisinières", 64900, null, 4, ["4 feux gaz", "Four 58 L", "Allumage électrique"]],
  ["Cuisinière 5 feux inox", "Iris", "Cuisinières", 54900, 59900, 7, ["5 feux gaz", "Four multifonction", "Façade inox"]],
  ["Climatiseur 12000 BTU Inverter", "Condor", "Climatiseurs", 79900, 84900, 9, ["12000 BTU", "Inverter", "Chaud / Froid", "Gaz R32"]],
  ["Climatiseur 18000 BTU", "Samsung", "Climatiseurs", 129900, null, 2, ["18000 BTU", "WindFree", "Wi-Fi"]],
  ["Téléviseur 55\" 4K UHD", "Samsung", "Téléviseurs", 109900, 119900, 5, ["Écran 55 pouces", "4K UHD", "Smart TV Tizen"]],
  ["Téléviseur 43\" Full HD", "Iris", "Téléviseurs", 45900, null, 11, ["Écran 43 pouces", "Full HD", "Android TV"]],
  ["Micro-ondes grill 25 L", "Samsung", "Micro-ondes", 24900, null, 14, ["Capacité : 25 L", "Fonction grill", "800 W"]],
  ["Micro-ondes 20 L", "Brandt", "Micro-ondes", 16900, 18900, 9, ["Capacité : 20 L", "700 W", "5 niveaux de puissance"]],
  ["Aspirateur sans sac 2000 W", "Philips", "Aspirateurs", 21900, null, 6, ["Sans sac", "2000 W", "Filtre HEPA"]],
  ["Aspirateur balai sans fil", "Moulinex", "Aspirateurs", 34900, 39900, 3, ["Sans fil", "Autonomie 45 min", "2 en 1"]],
  ["Robot pâtissier 1000 W", "Moulinex", "Robots de cuisine", 42900, null, 5, ["1000 W", "Bol inox 4,8 L", "6 vitesses"]],
  ["Blender chauffant", "Philips", "Robots de cuisine", 18900, null, 0, ["1,4 L", "Fonction soupe", "Lames inox"]],
  ["Machine à café expresso", "Philips", "Cafetières", 47900, 52900, 4, ["15 bars", "Mousseur à lait", "Réservoir 1,8 L"]],
  ["Cafetière filtre 12 tasses", "Moulinex", "Cafetières", 7900, null, 20, ["12 tasses", "Maintien au chaud", "Arrêt automatique"]],
  ["Fer à repasser vapeur 2400 W", "Philips", "Fers à repasser", 8900, null, 15, ["2400 W", "Semelle céramique", "Anti-calcaire"]],
  ["Centrale vapeur", "Moulinex", "Fers à repasser", 23900, 26900, 6, ["Pression 6 bars", "Réservoir 1,7 L", "Arrêt automatique"]],
];

(async () => {
  await connectDB();
  if (process.argv.includes("--reset")) {
    await Promise.all([Product.deleteMany({}), Brand.deleteMany({}), Category.deleteMany({})]);
    console.log("Catalogue vidé.");
  } else if (await Product.exists({})) {
    console.log("La base contient déjà des produits. Utilisez --reset pour repartir de zéro.");
    await mongoose.disconnect();
    return;
  }

  const brandDocs = Object.fromEntries(
    (await Brand.insertMany(brands.map((name) => ({ name, slug: slugify(name) })))).map((b) => [b.name, b])
  );
  const catDocs = Object.fromEntries(
    (await Category.insertMany(categories.map((c) => ({ ...c, slug: slugify(c.name) })))).map((c) => [c.name, c])
  );

  await Product.insertMany(
    products.map(([name, brand, cat, price, oldPrice, stock, characteristics], i) => ({
      name,
      slug: slugify(`${brand} ${name}`),
      description: `${name} de la marque ${brand}. Garantie constructeur, livraison dans les 69 wilayas.`,
      price,
      oldPrice,
      stock,
      characteristics,
      brand: brandDocs[brand]._id,
      category: catDocs[cat]._id,
      group: catDocs[cat].group,
      featured: i % 3 === 0,
      images: [],
    }))
  );
  console.log(`${brands.length} marques, ${categories.length} catégories, ${products.length} produits ajoutés.`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
