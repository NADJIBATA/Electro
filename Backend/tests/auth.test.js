const { setupDb, api, agentAs } = require("./helpers");

setupDb("auth");

describe("Authentification", () => {
  const user = { firstName: "Sara", lastName: "Khelifi", email: "sara@test.dz", password: "Password123" };

  test("inscription puis /me renvoie l'utilisateur sans mot de passe", async () => {
    const res = await api().post("/api/auth/register").send(user).expect(201);
    expect(res.body.user.email).toBe("sara@test.dz");
    expect(res.body.user.role).toBe("customer");
    expect(res.body.user.password).toBeUndefined();
    const cookie = res.headers["set-cookie"];
    expect(cookie.join(";")).toMatch(/HttpOnly/i);
    const me = await api().get("/api/auth/me").set("Cookie", cookie).expect(200);
    expect(me.body.user.email).toBe("sara@test.dz");
  });

  test("on ne peut pas s'inscrire comme admin", async () => {
    const res = await api().post("/api/auth/register").send({ ...user, role: "admin" }).expect(201);
    expect(res.body.user.role).toBe("customer");
  });

  test("email en double refusé (409)", async () => {
    await api().post("/api/auth/register").send(user).expect(201);
    const res = await api().post("/api/auth/register").send(user).expect(409);
    expect(res.body.message).toMatch(/email/i);
  });

  test("mauvais mot de passe refusé", async () => {
    await api().post("/api/auth/register").send(user).expect(201);
    await api().post("/api/auth/login").send({ email: user.email, password: "nope-nope" }).expect(401);
  });

  test("mot de passe trop court refusé avec détail", async () => {
    const res = await api().post("/api/auth/register").send({ ...user, password: "123" }).expect(400);
    expect(res.body.details[0].field).toBe("password");
  });

  test("injection NoSQL au login neutralisée", async () => {
    await api().post("/api/auth/register").send(user).expect(201);
    await api().post("/api/auth/login").send({ email: user.email, password: { $ne: "x" } }).expect(400);
  });

  test("changement de mot de passe exige l'ancien", async () => {
    const agent = await agentAs("customer", { email: "c@test.dz" });
    await agent.patch("/api/auth/me").send({ newPassword: "NewPassword1", currentPassword: "faux-faux" }).expect(400);
    await agent.patch("/api/auth/me").send({ newPassword: "NewPassword1", currentPassword: "Password123" }).expect(200);
    await api().post("/api/auth/login").send({ email: "c@test.dz", password: "NewPassword1" }).expect(200);
  });

  test("logout efface le cookie", async () => {
    const agent = await agentAs();
    await agent.post("/api/auth/logout").expect(200);
    const me = await agent.get("/api/auth/me").expect(200);
    expect(me.body.user).toBeNull();
  });
});
