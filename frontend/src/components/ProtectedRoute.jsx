import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { token, loading } = useAuth();

    // Wait until session restoration from localStorage is done
    if (loading) {
        return (
            <div className="auth-page">
                <div className="auth-loader">
                    <span className="btn-spinner large-spinner" />
                </div>
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
