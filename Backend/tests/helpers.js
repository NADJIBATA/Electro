// Environnement de test : définir avant tout require de l'app
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123";
process.env.CHARGILY_SECRET_KEY = "test_sk_chargily";
process.env.SHIPPING_FEE = "500";
process.env.FREE_SHIPPING_THRESHOLD = "200000";
process.env.ADMIN_NOTIFY_EMAIL = "boss@electro.dz";

const crypto = require("crypto");
const mongoose = require("mongoose");
const request = require("supertest");
const createApp = require("../src/app");
const User = require("../src/models/User");
const Brand = require("../src/models/Brand");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");

const BASE_URI = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017";

const setupDb = (name) => {
  beforeAll(async () => {
    await mongoose.connect(`${BASE_URI}/electro_test_${name}_${process.pid}`);
  });
  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
};

const app = createApp();
const api = () => request(app);

const agentAs = async (role = "customer", overrides = {}) => {
  const email = overrides.email || `${role}-${crypto.randomUUID().slice(0, 8)}@test.dz`;
  await User.create({ firstName: "Test", lastName: role, email, password: "Password123", role, ...overrides });
  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({ email, password: "Password123" }).expect(200);
  return agent;
};

const makeCatalog = async ({ stock = 5, price = 10000 } = {}) => {
  const brand = await Brand.create({ name: "Condor", slug: "condor" });
  const category = await Category.create({ name: "Frigos", slug: "frigos", group: "gros-menagers" });
  const product = await Product.create({
    name: "Frigo 400L",
    slug: "frigo-400l",
    price,
    stock,
    brand: brand._id,
    category: category._id,
    group: category.group,
  });
  return { brand, category, product };
};

const orderPayload = (items, extra = {}) => ({
  customer: { firstName: "Amine", lastName: "Benali", phone: "0551234567", email: "amine@test.dz" },
  shipping: { wilayaCode: 16, commune: "Bab Ezzouar", address: "Cité 1200 logements, bât 5" },
  items,
  paymentMethod: "cod",
  ...extra,
});

const sign = (body) => crypto.createHmac("sha256", process.env.CHARGILY_SECRET_KEY).update(body).digest("hex");

module.exports = { setupDb, api, app, agentAs, makeCatalog, orderPayload, sign };
