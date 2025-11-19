console.log("[DEBUG-START] DB_PASSWORD:", JSON.stringify(process.env.DB_PASSWORD));
require("dotenv").config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const userRoutes = require("./routes/userRoutes");
const repairRoutes = require("./routes/repairRoutes");
const repairerRoutes = require("./routes/repairerRoutes");
const messageRoutes = require("./routes/messageRoutes");
const locationRoutes = require("./routes/locationRoutes");
const repairOfferRoutes = require("./routes/repairOfferRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const pool = require("./config/db");

app.use(cors());
app.use(express.json());

// Attach io to app for use in routes/controllers
app.set('io', io);

app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));
app.get('/health', (req, res) => res.status(200).json({ ok: true, uptime: process.uptime() }));

// Routes API
app.use("/api/users", userRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/repairers", repairerRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/repair-offers", repairOfferRoutes);
app.use("/api/protected-route", protectedRoutes);

// Test de connexion BD
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-chat', (userId) => {
    connectedUsers.set(socket.id, userId);
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined (socket ${socket.id})`);
  });

  socket.on('send-message', (data) => {
    const { senderId, receiverId, content, repairRequestId } = data;
    io.to(`user-${receiverId}`).emit('receive-message', {
      senderId,
      content,
      repairRequestId,
      sentAt: new Date()
    });
  });

  socket.on('disconnect', () => {
    const userId = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    console.log(`User ${userId} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});




