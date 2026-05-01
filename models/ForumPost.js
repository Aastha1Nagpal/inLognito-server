const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 5000 },
  username: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  category: {
    type: String,
    required: true,
    enum: ["general", "tech", "confessions", "random"],
  },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ForumPost", forumPostSchema);
