import { createContext, useState, useContext } from "react";
import { loadOrGenerateKeyPair } from "../utils/e2ee";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        return localStorage.getItem("token");
    });

    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = async (newToken, userData) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);

        const { publicKey } = await loadOrGenerateKeyPair();
        const pubJwk = await crypto.subtle.exportKey("jwk", publicKey);

        await fetch("/api/keys", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify({ userId: userData.id, pubJwk }),
        });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = Boolean(token);

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("UseAuth must be within an AuthProvider");
    return ctx;
}
