const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const ForumPost = require("../models/ForumPost");
const ForumComment = require("../models/ForumComment");

const JWT_SECRET = "inlognito_secret_key";

// GET /api/forum/posts
router.get("/posts", async (req, res) => {
  try {
    const { category, sort } = req.query;
    const filter = category ? { category } : {};
    const sortOrder = sort === "top" ? { upvotes: -1 } : { createdAt: -1 };
    const posts = await ForumPost.find(filter).sort(sortOrder);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// POST /api/forum/posts
router.post("/posts", async (req, res) => {
  try {
    const { title, content, category, username, isGuest } = req.body;

    if (!title || !content || !category || !username) {
      return res.status(400).json({ error: "title, content, category and username are required" });
    }

    const post = await ForumPost.create({ title, content, category, username, isGuest: !!isGuest });
    res.status(201).json(post);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Failed to create post" });
  }
});

// GET /api/forum/posts/:postId
router.get("/posts/:postId", async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// GET /api/forum/posts/:postId/comments
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const comments = await ForumComment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/forum/posts/:postId/comments
router.post("/posts/:postId/comments", async (req, res) => {
  try {
    const { content, username, isGuest } = req.body;

    if (!content || !username) {
      return res.status(400).json({ error: "content and username are required" });
    }

    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = await ForumComment.create({
      postId: req.params.postId,
      content,
      username,
      isGuest: !!isGuest,
    });

    await ForumPost.findByIdAndUpdate(req.params.postId, { $inc: { commentCount: 1 } });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// POST /api/forum/posts/:postId/vote
router.post("/posts/:postId/vote", async (req, res) => {
  try {
    const { type } = req.body;
    if (type !== "up" && type !== "down") {
      return res.status(400).json({ error: "type must be 'up' or 'down'" });
    }

    const field = type === "up" ? "upvotes" : "downvotes";
    const post = await ForumPost.findByIdAndUpdate(
      req.params.postId,
      { $inc: { [field]: 1 } },
      { new: true }
    );

    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to vote" });
  }
});

// POST /api/forum/comments/:commentId/vote
router.post("/comments/:commentId/vote", async (req, res) => {
  try {
    const { type } = req.body;
    if (type !== "up" && type !== "down") {
      return res.status(400).json({ error: "type must be 'up' or 'down'" });
    }

    const field = type === "up" ? "upvotes" : "downvotes";
    const comment = await ForumComment.findByIdAndUpdate(
      req.params.commentId,
      { $inc: { [field]: 1 } },
      { new: true }
    );

    if (!comment) return res.status(404).json({ error: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: "Failed to vote" });
  }
});

// DELETE /api/forum/posts/:postId
router.delete("/posts/:postId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.username !== decoded.username) {
      return res.status(403).json({ error: "Not authorised to delete this post" });
    }

    await ForumPost.findByIdAndDelete(req.params.postId);
    await ForumComment.deleteMany({ postId: req.params.postId });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
