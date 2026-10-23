// Envoi d'emails via SMTP (Brevo, Gmail, Mailjet…). Sans SMTP, les emails sont affichés dans la console.
const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = env.mailEnabled
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

const sent = []; // utile pour les tests

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const formatDA = (n) => `${Number(n).toLocaleString("fr-DZ")} DA`;

const STATUS_LABELS = {
  pending: "En attente de confirmation",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const PAYMENT_LABELS = { cod: "Paiement à la livraison", online: "Paiement en ligne (CIB / Edahabia)" };

const layout = (title, body) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
  <div style="background:#1b9602;color:#fff;padding:16px 20px;font-size:20px;font-weight:bold">${escapeHtml(env.STORE_NAME)}</div>
  <div style="padding:20px;border:1px solid #e5e5e5;border-top:0">
    <h2 style="margin-top:0;font-size:18px">${escapeHtml(title)}</h2>
    ${body}
  </div>
</div>`;

const itemsTable = (order) => `
<table style="width:100%;border-collapse:collapse;font-size:14px">
  ${order.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #eee">${escapeHtml(i.name)} × ${i.quantity}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${formatDA(i.price * i.quantity)}</td>
      </tr>`
    )
    .join("")}
  <tr><td style="padding:6px 0">Livraison</td><td style="text-align:right">${formatDA(order.shippingFee)}</td></tr>
  <tr><td style="padding:6px 0;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold">${formatDA(order.total)}</td></tr>
</table>`;

const send = async ({ to, subject, html }) => {
  if (!to) return;
  sent.push({ to, subject, html });
  if (sent.length > 50) sent.shift();
  if (!transporter) {
    if (!env.isTest) console.log(`[email non envoyé — SMTP non configuré] À: ${to} | ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html });
  } catch (err) {
    // Un email qui échoue ne doit jamais faire échouer une commande
    console.error("Échec d'envoi d'email :", err.message);
  }
};

const notifyNewOrder = (order) => {
  const c = order.customer;
  const s = order.shipping;
  const adminHtml = layout(
    `Nouvelle commande ${order.orderNumber}`,
    `<p><b>Client :</b> ${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)} — ${escapeHtml(c.phone)}${
      c.email ? ` — ${escapeHtml(c.email)}` : ""
    }</p>
     <p><b>Livraison :</b> ${escapeHtml(s.address)}, ${escapeHtml(s.commune)}, ${s.wilayaCode} - ${escapeHtml(s.wilayaName)}</p>
     <p><b>Paiement :</b> ${PAYMENT_LABELS[order.paymentMethod]}</p>
     ${s.note ? `<p><b>Note :</b> ${escapeHtml(s.note)}</p>` : ""}
     ${itemsTable(order)}
     <p><a href="${env.CLIENT_URL}/admin/commandes/${order._id}">Voir la commande dans l'admin</a></p>`
  );
  const tasks = [send({ to: env.ADMIN_NOTIFY_EMAIL, subject: `🛒 Nouvelle commande ${order.orderNumber} — ${formatDA(order.total)}`, html: adminHtml })];

  if (c.email) {
    tasks.push(
      send({
        to: c.email,
        subject: `Votre commande ${order.orderNumber} est bien reçue`,
        html: layout(
          "Merci pour votre commande !",
          `<p>Bonjour ${escapeHtml(c.firstName)},</p>
           <p>Nous avons bien reçu votre commande <b>${order.orderNumber}</b>. Nous vous appellerons au ${escapeHtml(c.phone)} pour la confirmer.</p>
           ${itemsTable(order)}
           <p>Mode de paiement : ${PAYMENT_LABELS[order.paymentMethod]}</p>
           <p><a href="${env.CLIENT_URL}/suivi?commande=${order.orderNumber}">Suivre ma commande</a></p>`
        ),
      })
    );
  }
  return Promise.all(tasks);
};

const notifyStatusChange = (order) => {
  if (!order.customer.email) return Promise.resolve();
  return send({
    to: order.customer.email,
    subject: `Commande ${order.orderNumber} : ${STATUS_LABELS[order.status]}`,
    html: layout(
      `Votre commande est ${STATUS_LABELS[order.status].toLowerCase()}`,
      `<p>Bonjour ${escapeHtml(order.customer.firstName)},</p>
       <p>Le statut de votre commande <b>${order.orderNumber}</b> est maintenant : <b>${STATUS_LABELS[order.status]}</b>.</p>
       <p><a href="${env.CLIENT_URL}/suivi?commande=${order.orderNumber}">Suivre ma commande</a></p>`
    ),
  });
};

const notifyPaymentReceived = (order) =>
  send({
    to: env.ADMIN_NOTIFY_EMAIL,
    subject: `💳 Paiement reçu — ${order.orderNumber} (${formatDA(order.total)})`,
    html: layout(`Paiement en ligne reçu`, `<p>La commande ${order.orderNumber} a été payée en ligne.</p>${itemsTable(order)}`),
  });

module.exports = { send, notifyNewOrder, notifyStatusChange, notifyPaymentReceived, sent, STATUS_LABELS };
