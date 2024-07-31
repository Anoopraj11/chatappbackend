const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messagesRoutes");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoutes);

// Database connection
const MONGO_URL =
  process.env.MONGO_URL ||
  "mongodb+srv://anooprajpoot955:oQBwhccXlkDyWjIp@cluster0.twaqmd4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Use either ATLASDB_URL from .env or fallback to local URL
// const MONGO_URL = "mongodb://127.0.0.1:27017/chatapp"; // Use either ATLASDB_URL from .env or fallback to local URL

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

// Create HTTP server and attach it to Express app
const server = http.createServer(app);

// Start the server
const PORT = process.env.PORT || 3000; // Default to port 3000 if PORT is not defined in .env
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    credentials: true,
  },
});

// Global object to keep track of online users
global.onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("add-user", (userId) => {
    global.onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = global.onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
