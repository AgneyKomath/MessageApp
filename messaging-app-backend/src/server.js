require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const convoRoutes = require("./routes/conversations");
const messageRoutes = require("./routes/messages");
const keyRoutes = require("./routes/keys");
const usersRoutes = require("./routes/users");

const { verifyJWT, verifySocketJWT } = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});
app.set("io", io);

//connect mongoDB
connectDB();

//middleware
app.use(cors());
app.use(express.json());

//REST API routes
//public endpoints
app.use("/api/auth", authRoutes);
//protected endpoints
app.use("/api/conversations", verifyJWT, convoRoutes);
app.use("/api/messages", verifyJWT, messageRoutes);
app.use("/api/keys", verifyJWT, keyRoutes);
app.use("/api/users", verifyJWT, usersRoutes);

//WebSocket
io.use(verifySocketJWT);
io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);
    socket.join(userId);

    //join conversation room
    socket.on("joinConversation", (convoId) => {
        socket.join(convoId);
        console.log(`User ${userId} joined conversation ${convoId}`);
    });

    //receive a message
    socket.on("sendMessage", async ({ conversationId, iv, data }) => {
        try {
            const Message = require("./models/Message");
            const msg = await Message.create({
                conversation: conversationId,
                sender: userId,
                iv,
                data
            });

            const populated = await msg.populate("sender", "username");

            io.to(conversationId).emit("messageReceived", populated);
        } catch (err) {
            console.error("Socket sending message error:", err);
        }
    });
});

//check server
app.get("/", (req, res) => {
    res.send("Backend running yaaaay");
});

//start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
