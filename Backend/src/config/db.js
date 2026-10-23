const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

const connectDB = async (uri = env.MONGODB_URI) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  if (!env.isTest) console.log(`MongoDB connecté (${mongoose.connection.name})`);
  return mongoose.connection;
};

module.exports = { connectDB };
