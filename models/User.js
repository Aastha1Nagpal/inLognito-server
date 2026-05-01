const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  postCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);
