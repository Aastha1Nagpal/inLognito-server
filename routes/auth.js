const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { adjectives, nouns } = require("unique-username-generator");

const JWT_SECRET = process.env.JWT_SECRET;

const cleanAdjectives = adjectives.filter((w) => /^[a-z]+$/.test(w));
const cleanNouns = nouns.filter((w) => /^[a-z]+$/.test(w));

function generateGuestUsername() {
  const adj = cleanAdjectives[Math.floor(Math.random() * cleanAdjectives.length)];
  const noun = cleanNouns[Math.floor(Math.random() * cleanNouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  return `${cap(adj)}${cap(noun)}_${num}`;
}

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/guest", (req, res) => {
  const username = generateGuestUsername();
  res.json({ username, isGuest: true });
});

router.get("/check-username/:username", async (req, res) => {
  try {
    const existing = await User.findOne({ username: req.params.username });
    res.json({ available: !existing });
  } catch (err) {
    res.status(500).json({ error: "Check failed" });
  }
});

module.exports = router;
