import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            default: "New Chat",
        },
        history: [
            {
                role: String,
                parts: [{ text: String }],
            },
        ],
        messageCount: {
            type: Number,
            default: 0,
        },
        lastReset: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model("ChatSession", chatSessionSchema);
