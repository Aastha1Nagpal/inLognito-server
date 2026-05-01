const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  username: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  roomsVisited: { type: [String], default: [] },
  messageCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Session", sessionSchema);
