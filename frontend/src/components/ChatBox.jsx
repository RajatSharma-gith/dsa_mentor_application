import { useEffect, useState, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
const getUserId = () => {
    let userId = localStorage.getItem("userId");

    if (!userId) {
        userId = "user_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("userId", userId);
    }

    return userId;
}
const renderMessage = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        const [fullMatch, language, code] = match;

        // normal text before code
        if (match.index > lastIndex) {
            parts.push(
                <p key={lastIndex} className="whitespace-pre-wrap">
                    {text.slice(lastIndex, match.index)}
                </p>
            );
        }

        // code block
        parts.push(
            <div key={match.index} className="relative my-3 rounded-lg overflow-hidden">

                {/* 🔥 Copy Button */}
                <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded hover:bg-gray-600"
                >
                    Copy
                </button>

                {/* Code Block */}
                <SyntaxHighlighter
                    language={language || "javascript"}
                    style={vscDarkPlus}
                >
                    {code.trim()}
                </SyntaxHighlighter>

            </div>
        );

        lastIndex = match.index + fullMatch.length;
    }

    // remaining text
    if (lastIndex < text.length) {
        parts.push(<p className="whitespace-pre-wrap" key={lastIndex}>{text.slice(lastIndex)}</p>);
    }

    return parts;
};
const userId = getUserId();
export default function ChatBox() {
    const bottomRef = useRef(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [messages, setMessages] = useState([]);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    // 🔹 Load history on page load
    useEffect(() => {
        fetch(`/api/chat/history?userId=${userId}`)
            .then((res) => res.json())
            .then((data) => {
                setMessages(data.history || []);
            });
    }, []);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    // 🔹 Send message
    const sendMessage = async () => {
        setLoading(true);
        if (!input.trim()) return;

        const userMessage = {
            role: "user",
            parts: [{ text: input }],
        };

        setMessages((prev) => [...prev, userMessage]);

        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: userId, message: input }),
        });

        const data = await res.json();
        if (res.status === 429) {
            setErrorMsg(data.message);
            setLoading(false);
            return;
        }
        const botMessage = {
            role: "model",
            parts: [{ text: data.reply }],
        };

        setMessages((prev) => [...prev, botMessage]);

        setInput("");
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">

            {/* Chat messages */}
            {errorMsg && (
                <div className="bg-red-500 text-white p-2 text-center">
                    {errorMsg}
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`my-2 p-2 rounded max-w-xl ${msg.role === "user"
                            ? "bg-blue-600 ml-auto"
                            : "bg-gray-700"
                            }`}
                    >
                        {renderMessage(msg.parts[0].text)}
                    </div>

                ))}

            </div>

            {/* Input box */}
            <div className="flex p-4 gap-2">
                <input
                    className="flex-1 p-2 rounded bg-gray-800"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask DSA question..."

                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-500 px-4 rounded"
                >
                    Send
                </button>
                {loading && <p className="text-gray-400">Thinking...</p>}
            </div>
        </div>
    );
}