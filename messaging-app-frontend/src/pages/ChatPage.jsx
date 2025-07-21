import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { loadOrGenerateKeyPair, deriveAesKey, encryptText, decryptText } from "../utils/e2ee";

export default function ChatPage() {
    const { id: convoId } = useParams();
    const navigate = useNavigate();
    const { token, user, logout } = useAuth();

    const [aesKey, setAesKey] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [rawMessages, setRawMessages] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const socketRef = useRef();
    const bottomRef = useRef();

    //fetch old messages
    useEffect(() => {
        const fetchRaw = async () => {
            try {
                const res = await fetch(`/api/messages/${convoId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Could not load messages");
                const data = await res.json();
                setRawMessages(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchRaw();
    }, [convoId, token]);

    useEffect(() => {
        if (!aesKey || rawMessages.length === 0) return;

        const decryptAll = async () => {
            const decryptedTexts = await Promise.all(
                rawMessages.map((m) => decryptText(aesKey, m))
            );
            const withPlain = rawMessages.map((m, i) => ({
                ...m,
                text: decryptedTexts[i],
            }));
            setMessages(withPlain);
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
        };

        decryptAll();
    }, [aesKey, rawMessages]);

    //load or generate keypair and derive AES key
    // export & upload public key, fetch peer’s JWK, derive AES key
    useEffect(() => {
        if (!otherUser) return;
        let mounted = true;
        (async () => {
            const { privateKey } = await loadOrGenerateKeyPair();
            const res = await fetch(`/api/keys/${otherUser?._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Could not fetch peer public key");
            const { pubJwk: theirJwk } = await res.json();
            const aes = await deriveAesKey(privateKey, theirJwk);
            if (mounted) setAesKey(aes);
        })();
        return () => {
            mounted = false;
        };
    }, [otherUser, token]);

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

        return () => {
            socket.disconnect();
        };
    }, [convoId, token]);

    useEffect(() => {
        // don’t start listening until we can decrypt
        if (!aesKey) return;

        const socket = socketRef.current;
        const handler = async (payload) => {
            const text = await decryptText(aesKey, payload);
            setMessages((prev) => [...prev, { ...payload, text }]);
        };

        // register the listener
        socket.on("messageReceived", handler);

        // cleanup on unmount or aesKey change
        return () => {
            socket.off("messageReceived", handler);
        };
    }, [aesKey]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !aesKey) return;

        const cipher = await encryptText(aesKey, input.trim());
        socketRef.current.emit("sendMessage", {
            conversationId: convoId,
            ...cipher,
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
