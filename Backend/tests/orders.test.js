const { setupDb, api, agentAs, makeCatalog, orderPayload, sign } = require("./helpers");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const chargily = require("../src/services/chargily");
const mailer = require("../src/services/mailer");
const { expireStaleOnlineOrders } = require("../src/services/orders");

setupDb("orders");

afterEach(() => jest.restoreAllMocks());

const stockOf = async (id) => (await Product.findById(id)).stock;

describe("Commande avec paiement à la livraison", () => {
  test("création : prix lus en base, frais de port, stock décrémenté, emails", async () => {
    const { product } = await makeCatalog({ stock: 5, price: 10000 });
    mailer.sent.length = 0;
    const res = await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 2, price: 1 }]))
      .expect(201);

    const { order } = res.body;
    expect(order.orderNumber).toMatch(/^EL-\d{8}-[0-9A-F]{6}$/);
    expect(order.subtotal).toBe(20000);
    expect(order.shippingFee).toBe(500);
    expect(order.total).toBe(20500);
    expect(order.shipping.wilayaName).toBe("Alger");
    expect(await stockOf(product._id)).toBe(3);
    expect(res.body.checkoutUrl).toBeNull();
    expect(mailer.sent.map((m) => m.to).sort()).toEqual(["amine@test.dz", "boss@electro.dz"]);
  });

  test("livraison gratuite au-dessus du seuil", async () => {
    const { product } = await makeCatalog({ stock: 5, price: 100000 });
    const res = await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 2 }]))
      .expect(201);
    expect(res.body.order.shippingFee).toBe(0);
  });

  test("les doublons du panier sont regroupés", async () => {
    const { product } = await makeCatalog({ stock: 5 });
    const id = product._id.toString();
    const res = await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: id, quantity: 1 }, { productId: id, quantity: 2 }]))
      .expect(201);
    expect(res.body.order.items).toHaveLength(1);
    expect(res.body.order.items[0].quantity).toBe(3);
    expect(await stockOf(product._id)).toBe(2);
  });

  test("stock insuffisant : 409 et rien n'est décrémenté", async () => {
    const { product, brand, category } = await makeCatalog({ stock: 5 });
    const other = await Product.create({
      name: "Rare",
      slug: "rare",
      price: 100,
      stock: 1,
      brand: brand._id,
      category: category._id,
      group: "gros-menagers",
    });
    await api()
      .post("/api/orders")
      .send(
        orderPayload([
          { productId: product._id.toString(), quantity: 2 },
          { productId: other._id.toString(), quantity: 2 },
        ])
      )
      .expect(409);
    expect(await stockOf(product._id)).toBe(5);
    expect(await stockOf(other._id)).toBe(1);
    expect(await Order.countDocuments()).toBe(0);
  });

  test("commandes simultanées : jamais de survente", async () => {
    const { product } = await makeCatalog({ stock: 3 });
    const payload = orderPayload([{ productId: product._id.toString(), quantity: 1 }]);
    const results = await Promise.all(Array.from({ length: 8 }, () => api().post("/api/orders").send(payload)));
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(5);
    expect(await stockOf(product._id)).toBe(0);
  });

  test("validation : téléphone et wilaya invalides", async () => {
    const { product } = await makeCatalog();
    const bad = orderPayload([{ productId: product._id.toString(), quantity: 1 }]);
    bad.customer.phone = "12345";
    bad.shipping.wilayaCode = 70;
    const res = await api().post("/api/orders").send(bad).expect(400);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["customer.phone", "shipping.wilayaCode"]));
  });

  test("suivi public par numéro + téléphone, sans données personnelles", async () => {
    const { product } = await makeCatalog();
    const { body } = await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 1 }]))
      .expect(201);
    const n = body.order.orderNumber;
    await api().get(`/api/orders/track?number=${n}&phone=0999999999`).expect(404);
    const ok = await api().get(`/api/orders/track?number=${n.toLowerCase()}&phone=%2B213551234567`).expect(200);
    expect(ok.body.status).toBe("pending");
    expect(ok.body.customer).toBeUndefined();
    expect(ok.body.shipping.address).toBeUndefined();
  });
});

describe("Cycle de vie et annulation", () => {
  test("client connecté : voit ses commandes, peut annuler (stock restauré une seule fois)", async () => {
    const { product } = await makeCatalog({ stock: 5 });
    const agent = await agentAs("customer");
    const { body } = await agent
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 2 }]))
      .expect(201);
    const mine = await agent.get("/api/orders/mine").expect(200);
    expect(mine.body).toHaveLength(1);

    await agent.post(`/api/orders/${body.order._id}/cancel`).expect(200);
    expect(await stockOf(product._id)).toBe(5);
    await agent.post(`/api/orders/${body.order._id}/cancel`).expect(400);
    expect(await stockOf(product._id)).toBe(5);
  });

  test("un autre client ne peut pas voir ni annuler la commande", async () => {
    const { product } = await makeCatalog();
    const owner = await agentAs("customer");
    const intruder = await agentAs("customer");
    const { body } = await owner
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 1 }]))
      .expect(201);
    await intruder.get(`/api/orders/${body.order._id}`).expect(404);
    await intruder.post(`/api/orders/${body.order._id}/cancel`).expect(404);
  });

  test("admin : transitions de statut valides et invalides", async () => {
    const { product } = await makeCatalog({ stock: 5 });
    const admin = await agentAs("admin");
    const { body } = await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 1 }]))
      .expect(201);
    const id = body.order._id;
    await admin.patch(`/api/admin/orders/${id}/status`).send({ status: "delivered" }).expect(400);
    await admin.patch(`/api/admin/orders/${id}/status`).send({ status: "confirmed" }).expect(200);
    await admin.patch(`/api/admin/orders/${id}/status`).send({ status: "shipped" }).expect(200);
    const done = await admin.patch(`/api/admin/orders/${id}/status`).send({ status: "delivered" }).expect(200);
    expect(done.body.paymentStatus).toBe("paid");
    expect(done.body.statusHistory.map((h) => h.status)).toEqual(["pending", "confirmed", "shipped", "delivered"]);
    await admin.patch(`/api/admin/orders/${id}/status`).send({ status: "cancelled" }).expect(400);
    expect(await stockOf(product._id)).toBe(4);

    const stats = await admin.get("/api/admin/stats").expect(200);
    expect(stats.body.ordersByStatus.delivered).toBe(1);
    expect(stats.body.deliveredRevenue).toBe(body.order.total);

    const list = await admin.get("/api/admin/orders?search=Benali").expect(200);
    expect(list.body.total).toBe(1);
  });

  test("admin : annuler une commande expédiée remet le stock", async () => {
    const { product } = await makeCatalog({ stock: 5 });
    const admin = await agentAs("admin");
    const { body } = await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 3 }]))
      .expect(201);
    await admin.patch(`/api/admin/orders/${body.order._id}/status`).send({ status: "confirmed" }).expect(200);
    await admin.patch(`/api/admin/orders/${body.order._id}/status`).send({ status: "cancelled", note: "Client injoignable" }).expect(200);
    expect(await stockOf(product._id)).toBe(5);
  });
});

describe("Paiement en ligne (Chargily)", () => {
  const mockCheckout = () =>
    jest.spyOn(chargily, "createCheckout").mockResolvedValue({ id: "chk_123", checkout_url: "https://pay.chargily.net/test/checkouts/chk_123/pay" });

  const placeOnline = async (quantity = 1) => {
    const { product } = await makeCatalog({ stock: 5, price: 10000 });
    const res = await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity }], { paymentMethod: "online" }))
      .expect(201);
    return { product, res };
  };

  test("création : renvoie l'URL de paiement, pas d'email avant paiement", async () => {
    mockCheckout();
    mailer.sent.length = 0;
    const { res, product } = await placeOnline(2);
    expect(res.body.checkoutUrl).toMatch(/chargily/);
    expect(res.body.order.paymentStatus).toBe("pending");
    expect(await stockOf(product._id)).toBe(3);
    expect(mailer.sent).toHaveLength(0);
  });

  test("échec de Chargily : commande annulée et stock restauré", async () => {
    jest.spyOn(chargily, "createCheckout").mockRejectedValue(Object.assign(new Error("down"), { status: 502 }));
    const { product } = await makeCatalog({ stock: 5 });
    await api()
      .post("/api/orders")
      .send(orderPayload([{ productId: product._id.toString(), quantity: 2 }], { paymentMethod: "online" }))
      .expect(502);
    expect(await stockOf(product._id)).toBe(5);
    expect((await Order.findOne()).status).toBe("cancelled");
  });

  test("webhook : signature invalide refusée", async () => {
    const body = JSON.stringify({ type: "checkout.paid", data: { id: "chk_123" } });
    await api().post("/api/payments/chargily/webhook").set("Content-Type", "application/json").set("signature", "abc").send(body).expect(403);
  });

  test("webhook checkout.paid : commande payée + emails, idempotent", async () => {
    mockCheckout();
    const { res } = await placeOnline();
    mailer.sent.length = 0;
    const body = JSON.stringify({
      type: "checkout.paid",
      data: { id: "chk_123", status: "paid", amount: res.body.order.total, metadata: { orderId: res.body.order._id } },
    });
    for (let i = 0; i < 2; i++) {
      // eslint-disable-next-line no-await-in-loop
      await api()
        .post("/api/payments/chargily/webhook")
        .set("Content-Type", "application/json")
        .set("signature", sign(body))
        .send(body)
        .expect(200);
    }
    const order = await Order.findById(res.body.order._id);
    expect(order.paymentStatus).toBe("paid");
    expect(order.payment.paidAt).toBeInstanceOf(Date);
    // 2 emails (admin + client) pour la commande, 1 pour le paiement — envoyés une seule fois
    expect(mailer.sent).toHaveLength(3);
  });

  test("webhook avec montant inférieur ignoré", async () => {
    mockCheckout();
    const { res } = await placeOnline();
    const body = JSON.stringify({ type: "checkout.paid", data: { id: "chk_123", amount: 100 } });
    await api().post("/api/payments/chargily/webhook").set("Content-Type", "application/json").set("signature", sign(body)).send(body).expect(200);
    expect((await Order.findById(res.body.order._id)).paymentStatus).toBe("pending");
  });

  test("webhook checkout.failed : commande annulée, stock restauré", async () => {
    mockCheckout();
    const { res, product } = await placeOnline(2);
    const body = JSON.stringify({ type: "checkout.failed", data: { id: "chk_123" } });
    await api().post("/api/payments/chargily/webhook").set("Content-Type", "application/json").set("signature", sign(body)).send(body).expect(200);
    const order = await Order.findById(res.body.order._id);
    expect(order.status).toBe("cancelled");
    expect(order.paymentStatus).toBe("failed");
    expect(await stockOf(product._id)).toBe(5);
  });

  test("retour sur la page commande : statut vérifié auprès de Chargily", async () => {
    mockCheckout();
    const { res } = await placeOnline();
    jest.spyOn(chargily, "getCheckout").mockResolvedValue({ id: "chk_123", status: "paid" });
    const got = await api().get(`/api/orders/${res.body.order._id}`).expect(200);
    expect(got.body.paymentStatus).toBe("paid");
  });

  test("admin ne peut pas expédier une commande en ligne impayée", async () => {
    mockCheckout();
    const { res } = await placeOnline();
    const admin = await agentAs("admin");
    await admin.patch(`/api/admin/orders/${res.body.order._id}/status`).send({ status: "confirmed" }).expect(400);
  });

  test("les paiements abandonnés expirent et libèrent le stock", async () => {
    mockCheckout();
    const { res, product } = await placeOnline(2);
    await Order.collection.updateOne({ _id: new Order.base.Types.ObjectId(res.body.order._id) }, { $set: { createdAt: new Date(Date.now() - 2 * 3600 * 1000) } });
    expect(await expireStaleOnlineOrders()).toBe(1);
    expect(await stockOf(product._id)).toBe(5);
  });
});
