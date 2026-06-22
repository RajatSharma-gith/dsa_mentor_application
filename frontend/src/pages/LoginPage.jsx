import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed.");
                setLoading(false);
                return;
            }

            login(data.token, data.user);
            navigate("/");
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-logo-wrap">⚡</div>
                    <div className="auth-brand-name">DSA Mentor</div>
                    <div className="auth-brand-tag">AI-POWERED CODING GUIDE</div>
                </div>

                <h2 className="auth-heading">Welcome back</h2>
                <p className="auth-desc">Sign in to continue your learning journey</p>

                {error && (
                    <div className="auth-error">
                        <span>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="btn-spinner" /> : "Sign In →"}
                    </button>
                </form>

                <div className="auth-divider">or</div>

                <p className="auth-switch">
                    Don't have an account?{" "}
                    <Link to="/register" id="go-to-register">
                        Create one for free
                    </Link>
                </p>
            </div>
        </div>
    );
}
