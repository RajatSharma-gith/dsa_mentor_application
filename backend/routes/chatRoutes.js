import express from "express";
import ChatSession from "../models/ChatSession.js";
import { getChatResponse } from "../services/geminiService.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All chat routes require a valid JWT
router.use(authMiddleware);

// GET /api/chat/sessions — list all sessions for sidebar
router.get("/sessions", async (req, res) => {
    const userId = req.user.id;
    try {
        const sessions = await ChatSession.find({ userId })
            .select("_id title createdAt updatedAt")
            .sort({ updatedAt: -1 });
        res.json({ sessions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat/sessions — create a new empty session
router.post("/sessions", async (req, res) => {
    const userId = req.user.id;
    try {
        const session = await ChatSession.create({ userId, title: "New Chat", history: [] });
        res.status(201).json({ session });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat/history?sessionId=xxx — load messages for a session
router.get("/history", async (req, res) => {
    const { sessionId } = req.query;
    const userId = req.user.id;
    try {
        if (!sessionId) return res.json({ history: [] });
        const session = await ChatSession.findOne({ _id: sessionId, userId });
        res.json({ history: session?.history || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/chat — send a message (sessionId optional; creates session if missing)
router.post("/", async (req, res) => {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    try {
        let session;

        if (sessionId) {
            session = await ChatSession.findOne({ _id: sessionId, userId });
            if (!session) return res.status(404).json({ error: "Session not found." });
        } else {
            // First message — create a new session on the fly
            session = await ChatSession.create({ userId, title: "New Chat", history: [] });
        }

        // Daily message limit reset
        const now = new Date();
        if (now - session.lastReset > 24 * 60 * 60 * 1000) {
            session.messageCount = 0;
            session.lastReset = now;
        }

        if (session.messageCount >= 19) {
            return res.status(429).json({
                error: "LIMIT_EXCEEDED",
                message: "You have exceeded your daily limit. Try again after 24 hours.",
            });
        }

        // Set title from the first user message
        if (session.history.length === 0) {
            session.title = message.slice(0, 48) + (message.length > 48 ? "…" : "");
        }

        session.messageCount += 1;
        session.history.push({ role: "user", parts: [{ text: message }] });

        const reply = await getChatResponse(session.history);

        session.history.push({ role: "model", parts: [{ text: reply }] });

        await session.save();

        res.json({ reply, sessionId: session._id, title: session.title });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;