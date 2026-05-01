const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Room = require("../models/Room");
const Session = require("../models/Session");

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

module.exports = router;
