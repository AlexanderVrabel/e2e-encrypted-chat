import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import http from "http";
import { MongoClient } from "mongodb";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            sameSite: "lax",
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true },
});

const PORT = process.env.PORT || 3000;
const saltRounds = 10;
const client = new MongoClient(process.env.MONGO_URL);
await client.connect();

const db = client.db("chatapp");
const users = db.collection("users");
await users.createIndex({ email: 1 }, { unique: true });

server.listen(PORT, () => {
    console.log(`Express + Socket.IO running at http://localhost:${PORT}`);
});

async function registerUser(email, password, username, publicKey) {
    const existingUser = await users.findOne({ email });
    if (existingUser) {
        return { success: false, error: "Email already in use" };
    }

    const hash = await bcrypt.hash(password, saltRounds);


    const result = await users.insertOne({
        _id: uuidv4(),
        username,
        email,
        passwordHash: hash,
        publicKey,
        status: "offline",
        role: "user",
        createdAt: new Date(),
    });

    return { success: true, user: { email } };
}

async function loginUser(email, password) {
    const user = await users.findOne({ email });
    if (!user) {
        return { success: false, error: "User not found" };
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
        return { success: false, error: "Invalid password" };
    }

    return { success: true, user };
}

io.on("connection", socket => {
    console.log("User connected:", socket.id);

    socket.on("sendMessage", async msg => {
        try {

            await db.collection("messages").insertOne({
                ...msg,
                timestamp: new Date(),
            });

            io.emit("receiveMessage", msg);
        } catch (err) {
            console.error(" Error saving message:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

app.post("/api/register", async (req, res) => {
    const { email, password, username, publicKey } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ success: false, error: "Missing Email, Password, or Username" });
    }

    const result = await registerUser(email, password, username, publicKey);

    if (!result.success) {
        return res.status(400).json(result);
    }

    res.json(result);
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: "Missing Email or Password" });
    }

    const result = await loginUser(email, password);

    if (!result.success) {
        return res.status(400).json(result);
    }

    req.session.user = { id: result.user._id, email: result.user.email };

    res.json({
        success: true,
        user: {
            email: result.user.email,
            username: result.user.username,
            id: result.user._id,
        },
    });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, error: "Logout failed" });
        res.clearCookie("connect.sid");
        res.json({ success: true });
    });
});
app.get("/api/me", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get("/api/users/search", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const { q } = req.query;
    if (!q || q.length < 2) {
        return res.json([]);
    }

    const usersFound = await db
        .collection("users")
        .find({
            username: { $regex: q, $options: "i" },
            _id: { $ne: req.session.user.id },
        })
        .project({ _id: 1, username: 1, email: 1, publicKey: 1 })
        .limit(10)
        .toArray();

    res.json(usersFound);
});

app.get("/api/messages/:chatId", async (req, res) => {
    const chatId = req.params.chatId;

    const messages = await db.collection("messages").find({ chatId }).sort({ timestamp: 1 }).toArray();


    const userIds = [...new Set(messages.map(msg => msg.senderId))];
    const usersData = await db
        .collection("users")
        .find({ _id: { $in: userIds } })
        .toArray();
    const userMap = Object.fromEntries(usersData.map(u => [u._id, u.username]));

    const messagesWithNames = messages.map(msg => ({
        ...msg,
        senderName: userMap[msg.senderId] || "Unknown",
    }));

    res.json(messagesWithNames);
});
app.get("/api/chats", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const userId = req.session.user.id;
    const chats = await db.collection("chats").find({ participants: userId }).sort({ lastMessageAt: -1 }).toArray();

    res.json(chats);
});

app.get("/api/chats/:chatId", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const chat = await db.collection("chats").findOne({
        _id: req.params.chatId,
        participants: req.session.user.id,
    });

    if (!chat) {
        return res.status(404).json({ success: false, error: "Chat not found" });
    }

    res.json(chat);
});

app.post("/api/chats", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const { userIds, name, encryptedKeys } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ success: false, error: "userIds must be a non-empty array" });
    }


    const participants = Array.from(new Set([...userIds, req.session.user.id]));

    const chat = {
        _id: uuidv4(),
        name: name || "Private Chat",
        participants,
        encryptedKeys: encryptedKeys || {},
        lastMessageAt: new Date(),
        createdAt: new Date(),
    };

    try {
        await db.collection("chats").insertOne(chat);
        res.json({ success: true, chat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to create chat" });
    }
});
