import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/home" replace></Navigate> : children;
}
