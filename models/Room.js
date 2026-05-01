const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  topic: { type: String, required: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  isDefault: { type: Boolean, default: false },
});

module.exports = mongoose.model("Room", roomSchema);
