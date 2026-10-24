const dns = require("dns");
const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

// Certaines box (souvent sous Windows) ne résolvent pas les enregistrements SRV de mongodb+srv://.
// DNS_SERVERS=8.8.8.8,1.1.1.1 force des DNS publics pour Node uniquement.
const applyDnsServers = () => {
  const servers = (process.env.DNS_SERVERS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (servers.length) dns.setServers(servers);
};

const connectDB = async (uri = env.MONGODB_URI) => {
  applyDnsServers();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    console.error(
      `\nConnexion MongoDB impossible : ${String(err.message).split("\n")[0]}\n` +
        "Lance `npm run check-db` pour un diagnostic détaillé.\n"
    );
    throw err;
  }
  if (!env.isTest) console.log(`MongoDB connecté (${mongoose.connection.name})`);
  return mongoose.connection;
};

module.exports = { connectDB, applyDnsServers };
