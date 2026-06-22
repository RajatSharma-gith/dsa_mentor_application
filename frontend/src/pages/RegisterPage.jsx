import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed.");
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

                <h2 className="auth-heading">Create your account</h2>
                <p className="auth-desc">Start mastering DSA with an AI that actually teaches</p>

                {error && (
                    <div className="auth-error">
                        <span>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="reg-name">Full name</label>
                        <input
                            id="reg-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            required
                            placeholder="Rajat Sharma"
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email address</label>
                        <input
                            id="reg-email"
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
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm">Confirm password</label>
                        <input
                            id="reg-confirm"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        id="register-submit"
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="btn-spinner" /> : "Create Account →"}
                    </button>
                </form>

                <div className="auth-divider">or</div>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login" id="go-to-login">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
