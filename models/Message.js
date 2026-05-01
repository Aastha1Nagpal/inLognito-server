const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isSystem: { type: Boolean, default: false },
});

module.exports = mongoose.model("Message", messageSchema);
