// Diagnostic de connexion MongoDB. Usage : npm run check-db
const dns = require("dns").promises;
const net = require("net");
const mongoose = require("mongoose");
const env = require("../src/config/env");
const { applyDnsServers } = require("../src/config/db");

const mask = (uri) => uri.replace(/\/\/([^:]+):[^@]+@/, "//$1:****@");
const ok = (m) => console.log(`  ✔ ${m}`);
const ko = (m) => console.log(`  ✘ ${m}`);

const tcp = (host, port) =>
  new Promise((resolve) => {
    const s = net.connect({ host, port, timeout: 7000 });
    s.on("connect", () => { s.destroy(); resolve(true); });
    s.on("timeout", () => { s.destroy(); resolve(false); });
    s.on("error", () => resolve(false));
  });

(async () => {
  const uri = env.MONGODB_URI;
  console.log(`\nURI utilisée : ${mask(uri)}\n`);

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    ko("MONGODB_URI doit commencer par mongodb:// ou mongodb+srv://");
    process.exit(1);
  }
  if (/[<>]/.test(uri)) ko("L'URI contient encore < ou > : remplace <password> par ton vrai mot de passe.");

  applyDnsServers();

  let hosts = [];
  if (uri.startsWith("mongodb+srv://")) {
    const host = new URL(uri.replace("mongodb+srv://", "http://")).hostname;
    console.log("1. Résolution DNS du cluster");
    try {
      const records = await dns.resolveSrv(`_mongodb._tcp.${host}`);
      hosts = records.map((r) => [r.name, r.port]);
      ok(`${records.length} serveurs trouvés`);
    } catch (e) {
      ko(`Échec DNS (${e.code}).`);
      console.log(
        "\n  → Ta box ou ton fournisseur bloque ce type de requête DNS (fréquent sous Windows).\n" +
          "    Solution : ajoute cette ligne dans Backend\\.env puis relance :\n\n" +
          "      DNS_SERVERS=8.8.8.8,1.1.1.1\n"
      );
      process.exit(1);
    }
  } else {
    const u = new URL(uri.replace(/^mongodb:\/\//, "http://"));
    hosts = [[u.hostname, Number(u.port) || 27017]];
  }

  console.log("2. Accès réseau au port 27017");
  const reach = await tcp(hosts[0][0], hosts[0][1]);
  if (reach) ok(`${hosts[0][0]} joignable`);
  else {
    ko(`${hosts[0][0]}:${hosts[0][1]} injoignable.`);
    console.log(
      uri.includes("127.0.0.1") || uri.includes("localhost")
        ? "\n  → MongoDB local n'est pas démarré. Lance : Start-Service MongoDB\n"
        : "\n  → Le port 27017 est bloqué. Causes possibles :\n" +
            "    • Atlas > Network Access : ajoute 0.0.0.0/0 (ou ton IP) et attends 1 à 2 min ;\n" +
            "    • un pare-feu, un antivirus ou le réseau (école, entreprise, 4G) bloque le port 27017 :\n" +
            "      essaie avec un autre réseau, par exemple un partage de connexion.\n"
    );
    process.exit(1);
  }

  console.log("3. Authentification");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
    ok(`Connecté à la base « ${mongoose.connection.name} »`);
    console.log("\nTout fonctionne. Lance maintenant : npm run seed  puis  npm run dev\n");
    await mongoose.disconnect();
  } catch (e) {
    const msg = String(e.message || e);
    if (/auth|bad auth|Authentication failed/i.test(msg)) {
      ko("Utilisateur ou mot de passe refusé.");
      console.log("\n  → Vérifie l'utilisateur dans Atlas > Database Access, ou réinitialise son mot de passe.\n");
    } else if (/whitelist|IP.*not allowed|ReplicaSetNoPrimary|Server selection timed out/i.test(msg)) {
      ko("Le serveur refuse la connexion.");
      console.log("\n  → Atlas > Network Access : ajoute 0.0.0.0/0, attends 1 à 2 minutes, puis réessaie.\n");
    } else {
      ko(msg.split("\n")[0]);
    }
    process.exit(1);
  }
})();
