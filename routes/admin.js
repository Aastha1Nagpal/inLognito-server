const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Room = require("../models/Room");
const Session = require("../models/Session");
const User = require("../models/User");

router.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.delete("/rooms/:roomName", async (req, res) => {
  try {
    const { roomName } = req.params;
    const room = await Room.findOne({ name: roomName });

    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.isDefault) return res.status(403).json({ error: "Cannot delete a default room" });

    await Room.deleteOne({ name: roomName });
    await Message.deleteMany({ roomName });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete room" });
  }
});

router.get("/rooms/:roomName/messages", async (req, res) => {
  try {
    const messages = await Message.find({ roomName: req.params.roomName })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch room messages" });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await Session.find().sort({ joinedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

router.get("/forum-users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch forum users" });
  }
});

router.delete("/forum-posts/:postId", async (req, res) => {
  try {
    const ForumPost = require("../models/ForumPost");
    const ForumComment = require("../models/ForumComment");
    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    await ForumPost.findByIdAndDelete(req.params.postId);
    await ForumComment.deleteMany({ postId: req.params.postId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

router.delete("/forum-comments/:commentId", async (req, res) => {
  try {
    const ForumComment = require("../models/ForumComment");
    const ForumPost = require("../models/ForumPost");
    const comment = await ForumComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    await ForumComment.findByIdAndDelete(req.params.commentId);
    await ForumPost.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
