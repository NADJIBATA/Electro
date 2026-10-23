const mongoose = require("mongoose");

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"];

// Transitions autorisées pour le statut d'une commande
const TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customer: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true, default: "" },
    },
    shipping: {
      wilayaCode: { type: Number, required: true, min: 1, max: 69 },
      wilayaName: { type: String, required: true },
      commune: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      note: { type: String, trim: true, default: "" },
    },
    items: { type: [OrderItemSchema], validate: (v) => v.length > 0 },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    payment: {
      provider: { type: String, default: "" },
      checkoutId: { type: String, default: "" },
      checkoutUrl: { type: String, default: "" },
      paidAt: { type: Date, default: null },
    },
    status: { type: String, enum: STATUSES, default: "pending" },
    stockRestored: { type: Boolean, default: false },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: STATUSES },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "payment.checkoutId": 1 });

const Order = mongoose.model("Order", OrderSchema);
Order.STATUSES = STATUSES;
Order.PAYMENT_STATUSES = PAYMENT_STATUSES;
Order.TRANSITIONS = TRANSITIONS;
module.exports = Order;
