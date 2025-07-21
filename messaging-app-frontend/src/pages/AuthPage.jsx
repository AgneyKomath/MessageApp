import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
export default function AuthPage() {
    const { token, login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/home", { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const defaultMode = location.pathname.endsWith("/register") ? "register" : "login";
    const [mode, setMode] = useState(defaultMode);

    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";

        const payload = mode === "login" ? { email: form.email, password: form.password } : form;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || "Authentication failed");
            await login(data.token, data.user);
            navigate("/home", { replace: true });
        } catch (err) {
            setError(err.message);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow">
                {/* Tabs */}
                <div className="flex mb-6">
                    {["login", "register"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setMode(tab);
                                setError("");
                            }}
                            className={
                                `flex-1 py-2 font-semibold transition ` +
                                (mode === tab
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-500 hover:text-gray-700")
                            }
                        >
                            {tab === "login" ? "Log In" : "Register"}
                        </button>
                    ))}
                </div>

                {/* Error message */}
                {error && <div className="mb-4 text-sm text-red-600 text-center">{error}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        />
                    </div>

                    {mode === "register" && (
                        <div>
                            <label className="block text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                    >
                        {mode === "login" ? "Log In" : "Create Account"}
                    </button>
                </form>

                {/* Switch link */}
                <p className="mt-6 text-center text-sm text-gray-600">
                    {mode === "login" ? (
                        <>
                            Don’t have an account?{" "}
                            <button
                                onClick={() => {
                                    setMode("register");
                                    setError("");
                                }}
                                className="text-blue-600 hover:underline"
                            >
                                Register
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button
                                onClick={() => {
                                    setMode("login");
                                    setError("");
                                }}
                                className="text-blue-600 hover:underline"
                            >
                                Log In
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
