// Les 69 wilayas d'Algérie.
// 59 à 69 : décret présidentiel n° 26-206 du 25 mai 2026 (JO n° 40), en application de la loi n° 26-06.
const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar",
  "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger",
  "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma",
  "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh",
  "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued",
  "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
  "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa",
  "Aflou", "Barika", "El Kantara", "Bir El Ater", "El Aricha", "Ksar Chellala",
  "Aïn Oussera", "Messaad", "Ksar El Boukhari", "Bou Saâda", "El Abiodh Sidi Cheikh",
].map((name, i) => ({ code: i + 1, name }));

const findWilaya = (code) => WILAYAS.find((w) => w.code === Number(code));

module.exports = { WILAYAS, findWilaya };
