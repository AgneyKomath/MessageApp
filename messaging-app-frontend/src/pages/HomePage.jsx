import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function HomePage() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [convos, setConvos] = useState([]);
    const [error, setError] = useState();
    const [users, setUsers] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const socket = useRef();
    const pickerRef = useRef();

    // set socket
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

    //fetch convos
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

    //fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/users", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error("Failed to Load Users");
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchUsers();
    }, [token]);

    useEffect(() => {
        const handleClick = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleNewConvo = async (otherUserId) => {
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
            <header className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold">ChitChat</h1>
                    {user && <p className="text-sm opacity-75"> User: {user.username}</p>}
                </div>

                <div className="flex items-center space-x-2">
                    {/* New Chat button and picker */}
                    <div className="relative" ref={pickerRef}>
                        <button
                            onClick={() => setShowPicker((p) => !p)}
                            className="text-white border border-white/40 hover:border-white hover:bg-white hover:text-black px-4 py-1.5 rounded-md transition duration-100"
                        >
                            New
                        </button>
                        {showPicker && (
                            <div className="absolute right-0 mt-2 w-48 max-h-56 overflow-auto bg-white rounded shadow-lg z-10">
                                {users.length > 0 ? (
                                    users.map((u) => (
                                        <div
                                            key={u._id}
                                            onClick={() => {
                                                setShowPicker(false);
                                                handleNewConvo(u._id);
                                            }}
                                            className="px-3 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                                        >
                                            {u.username}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-gray-500">No users</div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="text-white border border-white/40 hover:border-white hover:bg-white hover:text-black px-4 py-1.5 rounded-md transition duration-100"
                    >
                        Logout
                    </button>
                </div>
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
