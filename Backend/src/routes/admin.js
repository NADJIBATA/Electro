const express = require("express");
const Joi = require("joi");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const validate = require("../middleware/validate");
const { requireAdmin } = require("../middleware/auth");
const { escapeRegex } = require("../utils/text");
const orderService = require("../services/orders");

const router = express.Router();
router.use(requireAdmin);

const listSchema = Joi.object({
  status: Joi.string().valid(...Order.STATUSES),
  paymentStatus: Joi.string().valid(...Order.PAYMENT_STATUSES),
  search: Joi.string().trim().max(100).allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [byStatus, revenue, recentRevenue, lowStock, customers, products, recentOrders] = await Promise.all([
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { status: "delivered" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Product.find({ isActive: true, stock: { $lte: 3 } }).sort({ stock: 1 }).limit(10).select("name stock slug").lean(),
      User.countDocuments({ role: "customer" }),
      Product.countDocuments({ isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(8).lean(),
    ]);
    res.json({
      ordersByStatus: Object.fromEntries(Order.STATUSES.map((s) => [s, byStatus.find((b) => b._id === s)?.count || 0])),
      deliveredRevenue: revenue[0]?.total || 0,
      last30Days: { revenue: recentRevenue[0]?.total || 0, orders: recentRevenue[0]?.count || 0 },
      lowStock,
      customers,
      products,
      recentOrders,
    });
  })
);

router.get(
  "/orders",
  validate(listSchema, "query"),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const filter = {};
    if (q.status) filter.status = q.status;
    if (q.paymentStatus) filter.paymentStatus = q.paymentStatus;
    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search), "i");
      filter.$or = [
        { orderNumber: rx },
        { "customer.phone": rx },
        { "customer.lastName": rx },
        { "customer.firstName": rx },
        { "customer.email": rx },
      ];
    }
    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
      Order.countDocuments(filter),
    ]);
    res.json({ items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
  })
);

router.get(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate("user", "firstName lastName email");
    if (!order) throw new AppError("Commande introuvable.", 404);
    res.json(order);
  })
);

router.patch(
  "/orders/:id/status",
  validate(
    Joi.object({
      status: Joi.string().valid(...Order.STATUSES).required(),
      note: Joi.string().trim().max(300).allow(""),
    })
  ),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Commande introuvable.", 404);
    await orderService.updateStatus(order, req.body.status, req.body.note || "");
    res.json(order);
  })
);

router.patch(
  "/orders/:id/payment",
  validate(Joi.object({ paymentStatus: Joi.string().valid("paid", "refunded").required() })),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Commande introuvable.", 404);
    order.paymentStatus = req.body.paymentStatus;
    if (req.body.paymentStatus === "paid" && !order.payment.paidAt) order.payment.paidAt = new Date();
    await order.save();
    res.json(order);
  })
);

router.get(
  "/users",
  validate(
    Joi.object({
      search: Joi.string().trim().max(100).allow(""),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
    "query"
  ),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery;
    const filter = {};
    if (q.search) {
      const rx = new RegExp(escapeRegex(q.search), "i");
      filter.$or = [{ email: rx }, { firstName: rx }, { lastName: rx }, { phone: rx }];
    }
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
      User.countDocuments(filter),
    ]);
    res.json({ items, total, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)) });
  })
);

module.exports = router;
