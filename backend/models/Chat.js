import mongoose from "mongoose";
import { type } from "node:os";

const chatSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    history: [
        {
            role: String,
            parts: [{
                text: String,
            }]
        }],

    messageCount: {
        type: Number,
        default: 0
    },
    lastReset: {
        type: Date,
        default: Date.now()
    }
});

export default mongoose.model("Chat", chatSchema);