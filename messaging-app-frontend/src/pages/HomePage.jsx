import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function HomePage() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [convos, setConvos] = useState([]);
    const [error, setError] = useState();
    const socket = useRef();

    useEffect(() => {
        socket.current = io("http://localhost:5000", {
            auth: { token },
            transports: ["websocket"],
        });

        socket.current.on("newConversation", (convo) => {
            setConvos((prev) => [convo, ...prev]);
        });

        return () => socket.current.disconnect();
    }, [token]);

    useEffect(() => {
        const fetchConvos = async () => {
            try {
                const res = await fetch("/api/conversations", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error("Failed to Load Chats");
                const data = await res.json();
                setConvos(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchConvos();
    }, [token]);

    const handleNewConvo = async () => {
        const otherUserId = window.prompt("Enter the ID of the user you want to chat with:");
        if (!otherUserId) return;
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ otherUserId }),
            });
            if (!res.ok) throw new Error("Failed to start chat");
            const convo = await res.json();
            navigate(`/chat/${convo._id}`);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top bar */}
            <header className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold">Agney's Chat App</h1>
                    {user && <p className="text-sm opacity-75">Signed in as {user.username}</p>}
                </div>
                <button
                    onClick={handleNewConvo}
                    className="ml-4 bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 transition"
                >
                    + New Chat
                </button>
                <button
                    onClick={handleLogout}
                    className="text-white border border-white/40 hover:border-white hover:bg-white hover:text-black px-4 py-1.5 rounded-md transition duration-100"
                >
                    Logout
                </button>
            </header>

            {/* Chat list */}
            <main className="flex-grow bg-gray-50 p-4 overflow-auto">
                {error && <div className="text-red-600 text-center mb-4">{error}</div>}
                {convos.length === 0 && !error ? (
                    <p className="text-center text-gray-500">No conversations yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {convos.map((convo) => {
                            const other =
                                convo.participants.find((p) => p._id !== user.id) ||
                                convo.participants[0];
                            return (
                                <li
                                    key={convo._id}
                                    onClick={() => navigate(`/chat/${convo._id}`)}
                                    className="cursor-pointer bg-white rounded-lg p-4 shadow hover:bg-gray-100 transition"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{other.username}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(convo.updatedAt).toLocaleString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>
        </div>
    );
}
