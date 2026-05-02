const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { adjectives, nouns } = require("unique-username-generator");
const Room = require("./models/Room");
const Message = require("./models/Message");
const Session = require("./models/Session");
const roomsRouter = require("./routes/rooms");
const adminRouter = require("./routes/admin");
const authRouter = require("./routes/auth");
const forumRouter = require("./routes/forum");

const defaultRooms = [
  { name: "general", topic: "Talk about anything", isDefault: true },
  { name: "tech", topic: "Technology, coding, gadgets", isDefault: true },
  { name: "confessions", topic: "Say what you cant say elsewhere", isDefault: true },
];

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/inlognito")
  .then(async () => {
    console.log("MongoDB connected");
    const count = await Room.countDocuments({ isDefault: true });
    if (count === 0) {
      await Room.insertMany(defaultRooms);
      console.log("Default rooms seeded");
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use("/api/rooms", roomsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/forum", forumRouter);

// Only single words (no hyphens/spaces) so CamelCase stays clean
const cleanAdjectives = adjectives.filter((w) => /^[a-z]+$/.test(w));
const cleanNouns = nouns.filter((w) => /^[a-z]+$/.test(w));

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generateUsername() {
  const adjective = cleanAdjectives[Math.floor(Math.random() * cleanAdjectives.length)];
  const noun = cleanNouns[Math.floor(Math.random() * cleanNouns.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${capitalize(adjective)}${capitalize(noun)}_${number}`;
}

const activeUsers = {};

app.get("/", (req, res) => {
  res.json({ status: "inLognito server running" });
});

app.get("/api/rooms/counts", (req, res) => {
  const { rooms, sids } = io.sockets.adapter;
  const counts = {};
  for (const [roomName, sockets] of rooms) {
    if (!sids.has(roomName)) {
      counts[roomName] = sockets.size;
    }
  }
  res.json(counts);
});

function getRoomUserCount(roomName) {
  const room = io.sockets.adapter.rooms.get(roomName);
  return room ? room.size : 0;
}

io.on("connection", async (socket) => {
  const username = generateUsername();
  const sessionId = crypto.randomUUID();
  const ipAddress = socket.handshake.address;
  const userAgent = socket.handshake.headers["user-agent"] || "";

  const session = await Session.create({ sessionId, username, ipAddress, userAgent });
  activeUsers[socket.id] = { username, sessionId };

  socket.emit("assigned_username", username);
  console.log(`${username} connected [${sessionId}]`);

  socket.on("join_room", async (roomName) => {
    socket.join(roomName);

    await Message.create({ roomName, username, message: `${username} joined`, isSystem: true });
    await Session.updateOne({ sessionId }, { $addToSet: { roomsVisited: roomName } });

    io.to(roomName).emit("system_message", { message: `${username} joined`, roomName });
    io.to(roomName).emit("user_count", getRoomUserCount(roomName));
  });

  socket.on("leave_room", async (roomName) => {
    socket.leave(roomName);

    await Message.create({ roomName, username, message: `${username} left`, isSystem: true });

    io.to(roomName).emit("system_message", { message: `${username} left`, roomName });
    io.to(roomName).emit("user_count", getRoomUserCount(roomName));
  });

  socket.on("send_message", async ({ roomName, message }) => {
    if (typeof message !== "string") return;
    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 500) return;

    const saved = await Message.create({ roomName, username, message: trimmed });
    const timestamp = saved.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    await Session.updateOne({ sessionId }, { $inc: { messageCount: 1 } });

    io.to(roomName).emit("receive_message", { username, message: trimmed, timestamp, roomName });
  });

  socket.on("get_history", async (roomName) => {
    const history = await Message.find({ roomName }).sort({ timestamp: 1 }).limit(50);

    const formatted = history.map((m) => ({
      type: m.isSystem ? "system" : "message",
      username: m.username,
      message: m.message,
      timestamp: m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      roomName: m.roomName,
    }));

    socket.emit("room_history", { roomName, messages: formatted });
  });

  socket.on("disconnect", async () => {
    const { username: disconnectedUsername } = activeUsers[socket.id];
    console.log(`${disconnectedUsername} disconnected`);
    delete activeUsers[socket.id];
    await Session.updateOne({ sessionId }, { leftAt: new Date() });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
