const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, topic, createdBy } = req.body;

    if (!name || !topic) {
      return res.status(400).json({ error: "Name and topic are required" });
    }

    const normalized = name.trim().toLowerCase().replace(/\s+/g, "-");

    const existing = await Room.findOne({ name: normalized });
    if (existing) {
      return res.status(409).json({ error: "A room with that name already exists" });
    }

    const room = await Room.create({ name: normalized, topic, createdBy });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: "Failed to create room" });
  }
});

module.exports = router;
