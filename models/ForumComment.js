const mongoose = require("mongoose");

const forumCommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true },
  content: { type: String, required: true, maxlength: 2000 },
  username: { type: String, required: true },
  isGuest: { type: Boolean, default: false },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ForumComment", forumCommentSchema);
