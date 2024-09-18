const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommandSchema = new Schema({
  Buyer: {
    FirstName: String,
    LastName: String,
    PhoneNumber: String,
    Location: {
      City: String,
      Municipality: String,
    },
  },
  Product: { type: Schema.Types.ObjectId, ref: "Product" },
  isDelivered: {
    type: Boolean,
    default: false,
  },
});

const Command = mongoose.model("Command", CommandSchema);
module.exports = Command;
