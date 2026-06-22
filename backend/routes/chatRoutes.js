import express from "express";
import Chat from "../models/Chat.js";
import { getChatResponse } from "../services/geminiService.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All chat routes require a valid JWT
router.use(authMiddleware);

// POST → send message
router.post("/", async (req, res) => {
    const { message } = req.body;
    const userId = req.user.id; // from verified JWT

    try {
        let chat = await Chat.findOne({ userId });

        if (!chat) {
            chat = new Chat({ userId, history: [] });
        }
        const now = new Date();
        if (now - chat.lastReset > 24 * 60 * 60 * 1000) {
            chat.messageCount = 0;
            chat.lastReset = now;
        }

        // ❌ LIMIT CHECK
        if (chat.messageCount >= 19) {
            return res.status(429).json({
                error: "LIMIT_EXCEEDED",
                message: "You have exceeded your daily limit. Try again after 24 hours.",
            });
        }

        // ✅ Increase count
        chat.messageCount += 1;
        // push user message
        chat.history.push({
            role: "user",
            parts: [{ text: message }],
        });

        const reply = await getChatResponse(chat.history);

        // push AI reply
        chat.history.push({
            role: "model",
            parts: [{ text: reply }],
        });

        await chat.save();

        res.json({ reply });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

// GET → fetch history
router.get("/history", async (req, res) => {
    const userId = req.user.id; // from verified JWT

    try {
        const chat = await Chat.findOne({ userId });
        res.json({ history: chat?.history || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;