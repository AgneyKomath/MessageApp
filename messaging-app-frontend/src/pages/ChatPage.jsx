import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

export default function ChatPage() {
    const { id: convoId } = useParams();
    const navigate = useNavigate();
    const { token, user, logout } = useAuth();

    const [otherUser, setOtherUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const socketRef = useRef();
    const bottomRef = useRef();

    //fetch old messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages/${convoId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Could not load messages for some reason idk");
                const data = await res.json();
                setMessages(data);
                bottomRef.current?.scrollIntoView({ behavior: "auto" });
            } catch (err) {
                setError(err.message);
            }
        };
        fetchMessages();
    }, [convoId, token]);

    //find other user
    useEffect(() => {
        const fetchConvos = async () => {
            try {
                const res = await fetch("/api/conversations", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Could not load conversation data");
                const data = await res.json();
                const convo = data.find((c) => c._id === convoId);
                if (!convo) throw new Error("Conversation not Found");
                const other =
                    convo.participants.find((p) => p._id !== user.id) || convo.participants[0];
                setOtherUser(other);
            } catch (err) {
                console.error(err);
                setError(err.message);
            }
        };
        fetchConvos();
    }, [convoId, token, user.id]);

    //setup socket
    useEffect(() => {
        const socket = io("http://localhost:5000", { auth: { token }, transports: ["websocket"] });

        socketRef.current = socket;

        socket.on("connect_error", (err) => {
            console.error("Socket error", err.message);
        });

        socket.on("connect", () => {
            socket.emit("joinConversation", convoId);
        });

        socket.on("messageReceived", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.disconnect();
        };
    }, [convoId, token]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ beahvior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        socketRef.current.emit("sendMessage", {
            conversationId: convoId,
            text: input.trim(),
        });
        setInput("");
    };

    const handleBack = () => {
        navigate("/home");
    };

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="text-white border border-white/40 hover:border-white hover:bg-white hover:text-black px-4 py-1.5 rounded-md transition duration-100"
                >
                    ← Back
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-semibold">
                        {otherUser ? otherUser.username : "Loading..."}
                    </h1>
                    <p className="text-xs opacity-75">
                        {otherUser ? `@${otherUser.username}` : `Conversation ${convoId}`}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-white border border-white/40 hover:border-white hover:bg-white hover:text-black px-4 py-1.5 rounded-md transition duration-100"
                >
                    Logout
                </button>
            </header>

            {/* Messages */}
            <main className="flex-grow p-4 overflow-auto bg-gray-50">
                {error && <div className="text-red-600 text-center mb-2">{error}</div>}
                <ul className="space-y-2">
                    {messages.map((msg) => (
                        <li
                            key={msg._id}
                            className={`flex ${
                                msg.sender._id === user.id ? "justify-end" : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                    msg.sender._id === user.id
                                        ? "bg-blue-600 text-white"
                                        : "bg-white text-gray-800"
                                }`}
                            >
                                {msg.text}
                                <div className="text-xs opacity-50 text-right mt-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
                <div ref={bottomRef} />
            </main>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center p-4 bg-white">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring focus:border-blue-300"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
