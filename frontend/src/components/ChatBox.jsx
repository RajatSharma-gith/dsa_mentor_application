import { useEffect, useState, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/* ─── Code syntax style override ────────────────────────── */
const codeStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
        ...vscDarkPlus['pre[class*="language-"]'],
        background: "#0d1117",
        margin: 0,
        padding: "1rem",
        fontSize: "0.82rem",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineHeight: "1.65",
    },
    'code[class*="language-"]': {
        ...vscDarkPlus['code[class*="language-"]'],
        background: "transparent",
        fontSize: "0.82rem",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    },
};

/* ─── Render a message (text + code blocks) ───────────────── */
function CodeBlock({ language, code }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="code-wrapper">
            <div className="code-header">
                <span className="code-lang">{language || "code"}</span>
                <button
                    className={`code-copy-btn ${copied ? "copied" : ""}`}
                    onClick={handleCopy}
                >
                    {copied ? "✓ copied" : "copy"}
                </button>
            </div>
            <SyntaxHighlighter language={language || "javascript"} style={codeStyle}>
                {code.trim()}
            </SyntaxHighlighter>
        </div>
    );
}

/* markdown components — wires code blocks to our styled CodeBlock */
const mdComponents = {
    code({ node, inline, className, children, ...props }) {
        const language = /language-(\w+)/.exec(className || "")?.[1];
        if (!inline && language) {
            return <CodeBlock language={language} code={String(children).replace(/\n$/, "")} />;
        }
        return (
            <code
                style={{
                    background: "#1a1e2e",
                    padding: "0.15em 0.4em",
                    borderRadius: "4px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.82em",
                    color: "#a78bfa",
                }}
                {...props}
            >
                {children}
            </code>
        );
    },
    p({ children }) {
        return <p style={{ marginBottom: "0.5rem", lineHeight: "1.75" }}>{children}</p>;
    },
    ul({ children }) {
        return <ul style={{ paddingLeft: "1.25rem", marginBottom: "0.5rem", listStyleType: "disc" }}>{children}</ul>;
    },
    ol({ children }) {
        return <ol style={{ paddingLeft: "1.25rem", marginBottom: "0.5rem" }}>{children}</ol>;
    },
    li({ children }) {
        return <li style={{ marginBottom: "0.2rem" }}>{children}</li>;
    },
    strong({ children }) {
        return <strong style={{ color: "#e8eaf0", fontWeight: 600 }}>{children}</strong>;
    },
    h1({ children }) { return <h1 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem", color: "#e8eaf0" }}>{children}</h1>; },
    h2({ children }) { return <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.4rem", color: "#e8eaf0" }}>{children}</h2>; },
    h3({ children }) { return <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.35rem", color: "#c8cde0" }}>{children}</h3>; },
};

function MarkdownMessage({ text }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={mdComponents}
        >
            {text}
        </ReactMarkdown>
    );
}

/* ─── Suggestion chips ────────────────────────────────────── */
const SUGGESTIONS = [
    "Explain binary search with code",
    "How does BFS differ from DFS?",
    "What is dynamic programming?",
    "Solve two-sum problem",
    "Explain merge sort",
    "What is a balanced BST?",
];

/* ─── Avatar initials ─────────────────────────────────────── */
function initials(name = "") {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";
}

/* ─── Send icon ───────────────────────────────────────────── */
function SendIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

/* ─── Logout icon ─────────────────────────────────────────── */
function LogoutIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

/* ─── Main component ──────────────────────────────────────── */
export default function ChatBox() {
    const { token, user, logout } = useAuth();
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    const [errorMsg, setErrorMsg] = useState("");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    /* Load history */
    useEffect(() => {
        if (!token) return;
        fetch("/api/chat/history", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => setMessages(d.history || []));
    }, [token]);

    /* Scroll to bottom */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    /* Auto-grow textarea */
    const handleInput = (e) => {
        setInput(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = "auto";
            ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
        }
    };

    /* Send */
    const sendMessage = async (text = input) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        setErrorMsg("");
        setMessages((prev) => [...prev, { role: "user", parts: [{ text: trimmed }] }]);
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: trimmed }),
            });

            const data = await res.json();

            if (res.status === 429) { setErrorMsg(data.message); return; }
            if (!res.ok) { setErrorMsg(data.error || "Something went wrong."); return; }

            setMessages((prev) => [...prev, { role: "model", parts: [{ text: data.reply }] }]);
        } catch {
            setErrorMsg("Network error — please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleLogout = () => { logout(); navigate("/login"); };

    return (
        <div className="chat-shell">
            {/* ── Sidebar ── */}
            <aside className="chat-sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">⚡</div>
                    <span className="sidebar-logo-text">DSA Mentor</span>
                </div>

                <button className="sidebar-new-chat" onClick={() => setMessages([])}>
                    <span style={{ fontSize: "1rem", lineHeight: 1 }}>＋</span>
                    New conversation
                </button>

                <span className="sidebar-section-label">Topics</span>
                {["Arrays & Hashing", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Sorting & Searching"].map((t) => (
                    <button
                        key={t}
                        className="chip"
                        style={{ borderRadius: "8px", textAlign: "left", padding: "0.45rem 0.75rem" }}
                        onClick={() => sendMessage(`Teach me about: ${t}`)}
                    >
                        {t}
                    </button>
                ))}

                <div className="sidebar-spacer" />

                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials(user?.name)}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name || "User"}</div>
                        <div className="sidebar-user-role">Free plan · 19 msg/day</div>
                    </div>
                    <button id="logout-btn" className="sidebar-logout" title="Logout" onClick={handleLogout}>
                        <LogoutIcon />
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="chat-main">
                {/* Top bar */}
                <div className="chat-topbar">
                    <div className="topbar-model">
                        <div className="topbar-model-dot" />
                        Gemini · DSA Specialist
                    </div>
                    <div className="topbar-badge">Beta</div>
                </div>

                {/* Error */}
                {errorMsg && (
                    <div className="error-banner" style={{ marginTop: "0.75rem" }}>
                        <span>⚠</span> {errorMsg}
                    </div>
                )}

                {/* Messages */}
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="chat-empty">
                            <div className="chat-empty-icon">⚡</div>
                            <div>
                                <p className="chat-empty-title">What do you want to learn?</p>
                                <p className="chat-empty-sub">Ask anything about algorithms, data structures, complexity, or coding interviews.</p>
                            </div>
                            <div className="chat-empty-chips">
                                {SUGGESTIONS.map((s) => (
                                    <button key={s} className="chip" onClick={() => sendMessage(s)}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className={`msg-row ${msg.role === "user" ? "user" : ""}`}>
                                <div className={`msg-avatar ${msg.role === "user" ? "user" : "bot"}`}>
                                    {msg.role === "user" ? initials(user?.name) : "⚡"}
                                </div>
                                <div className={`msg-bubble ${msg.role === "user" ? "user" : "bot"}`}>
                                    <MarkdownMessage text={msg.parts[0].text} />
                                </div>
                            </div>
                        ))
                    )}

                    {loading && (
                        <div className="typing-row">
                            <div className="msg-avatar bot">⚡</div>
                            <div className="typing-dots">
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="chat-input-area">
                    <div className="chat-input-box">
                        <textarea
                            id="chat-input"
                            ref={textareaRef}
                            className="chat-textarea"
                            rows={1}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about algorithms, data structures, complexity…"
                        />
                        <button
                            id="send-btn"
                            className="chat-send-btn"
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                        >
                            <SendIcon />
                        </button>
                    </div>
                    <p className="input-hint">Enter to send · Shift+Enter for new line</p>
                </div>
            </main>
        </div>
    );
}