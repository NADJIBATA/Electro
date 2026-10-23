const path = require("path");
const fs = require("fs");
const { setupDb, api, agentAs, makeCatalog } = require("./helpers");
const Product = require("../src/models/Product");

setupDb("catalog");

// Petit PNG valide (1x1)
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

describe("Droits d'accès admin", () => {
  test("visiteur : 401 sur création de produit", async () => {
    await api().post("/api/products").send({ name: "x" }).expect(401);
  });
  test("client : 403 sur création de marque, de commande admin et stats", async () => {
    const agent = await agentAs("customer");
    await agent.post("/api/brands").send({ name: "Pirate" }).expect(403);
    await agent.get("/api/admin/stats").expect(403);
    await agent.get("/api/admin/orders").expect(403);
  });
});

describe("Gestion du catalogue (admin)", () => {
  let admin;
  beforeEach(async () => {
    admin = await agentAs("admin");
  });

  test("créer marque + catégorie + produit avec image, puis le retrouver par slug", async () => {
    const brand = await admin.post("/api/brands").field("name", "Iris").attach("image", PNG, "logo.png").expect(201);
    expect(brand.body.slug).toBe("iris");
    expect(brand.body.logo.url).toMatch(/\/uploads\/brands\//);

    const cat = await admin
      .post("/api/categories")
      .send({ name: "Téléviseurs", group: "gros-menagers" })
      .expect(201);
    expect(cat.body.slug).toBe("televiseurs");

    const prod = await admin
      .post("/api/products")
      .field("name", "TV 55 pouces")
      .field("price", "99900")
      .field("stock", "4")
      .field("brand", brand.body._id)
      .field("category", cat.body._id)
      .field("characteristics", "4K\nSmart TV")
      .attach("images", PNG, "a.png")
      .attach("images", PNG, "b.png")
      .expect(201);
    expect(prod.body.group).toBe("gros-menagers");
    expect(prod.body.images).toHaveLength(2);
    expect(prod.body.characteristics).toEqual(["4K", "Smart TV"]);

    const got = await api().get("/api/products/tv-55-pouces").expect(200);
    expect(got.body.product.brand.name).toBe("Iris");

    // nettoyage des fichiers locaux
    for (const img of [...prod.body.images, brand.body.logo]) {
      const file = path.join(__dirname, "../uploads", img.publicId.slice(6));
      expect(fs.existsSync(file)).toBe(true);
    }
    await admin.delete(`/api/products/${prod.body._id}`).expect(200);
    for (const img of prod.body.images) {
      expect(fs.existsSync(path.join(__dirname, "../uploads", img.publicId.slice(6)))).toBe(false);
    }
    await admin.delete(`/api/brands/${brand.body._id}`).expect(200);
  });

  test("fichier non-image refusé", async () => {
    const res = await admin.post("/api/brands").field("name", "X").attach("image", Buffer.from("hello"), "x.txt").expect(400);
    expect(res.body.message).toMatch(/format/i);
  });

  test("impossible de supprimer une marque utilisée", async () => {
    const { brand } = await makeCatalog();
    await admin.delete(`/api/brands/${brand._id}`).expect(409);
  });

  test("mise à jour : changer le prix, garder une seule image", async () => {
    const { product } = await makeCatalog();
    product.images = [
      { url: "http://x/1.png", publicId: "p1" },
      { url: "http://x/2.png", publicId: "p2" },
    ];
    await product.save();
    const res = await admin
      .patch(`/api/products/${product._id}`)
      .send({ price: 12345, keepImages: ["p2"], oldPrice: "" })
      .expect(200);
    expect(res.body.price).toBe(12345);
    expect(res.body.images.map((i) => i.publicId)).toEqual(["p2"]);
    expect(res.body.oldPrice).toBeNull();
  });

  test("changer le groupe d'une catégorie met à jour ses produits", async () => {
    const { category, product } = await makeCatalog();
    await admin.patch(`/api/categories/${category._id}`).send({ group: "petits-menagers" }).expect(200);
    expect((await Product.findById(product._id)).group).toBe("petits-menagers");
  });
});

describe("Catalogue public", () => {
  test("filtres, tri, pagination, produits inactifs cachés", async () => {
    const { brand, category } = await makeCatalog();
    await Product.insertMany(
      [1, 2, 3, 4, 5].map((i) => ({
        name: `Produit ${i}`,
        slug: `produit-${i}`,
        price: i * 1000,
        stock: i === 5 ? 0 : 3,
        brand: brand._id,
        category: category._id,
        group: "gros-menagers",
        isActive: i !== 4,
      }))
    );
    const res = await api().get("/api/products?search=produit&sort=price-desc&limit=2&page=1").expect(200);
    expect(res.body.total).toBe(4); // produit 4 inactif
    expect(res.body.pages).toBe(2);
    expect(res.body.items.map((p) => p.price)).toEqual([5000, 3000]);

    const stock = await api().get("/api/products?search=produit&inStock=true").expect(200);
    expect(stock.body.total).toBe(3);

    const price = await api().get("/api/products?minPrice=2000&maxPrice=3000").expect(200);
    expect(price.body.items.map((p) => p.price).sort()).toEqual([2000, 3000]);

    await api().get("/api/products/produit-4").expect(404);
    const bySlug = await api().get("/api/products?brand=condor&category=frigos").expect(200);
    expect(bySlug.body.total).toBe(5);
  });

  test("recherche avec caractères spéciaux sans erreur", async () => {
    await api().get("/api/products?search=" + encodeURIComponent("(.*[")).expect(200);
  });

  test("liste des wilayas : 69", async () => {
    const res = await api().get("/api/meta/wilayas").expect(200);
    expect(res.body).toHaveLength(69);
    expect(res.body[15]).toEqual({ code: 16, name: "Alger" });
  });
});
