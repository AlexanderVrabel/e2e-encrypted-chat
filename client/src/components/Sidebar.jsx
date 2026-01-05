import { useEffect, useState } from "react";
import { encryptSessionKey, generateSessionKey, importKey } from "../utils/crypto";
import { getKeys } from "../utils/keyStorage";
import Logout from "./Logout";
import UserSearchModal from "./UserSearchModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function Sidebar({ selectedChat, setSelectedChat, user }) {
    const [chats, setChats] = useState([]);
    const [error, setError] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/chats`, { credentials: "include" })
            .then(async res => {
                const data = await res.json().catch(() => null);

                if (!res.ok || !Array.isArray(data)) {
                    throw new Error(data?.error || "Invalid response from server");
                }

                setChats(data);
            })
            .catch(err => {
                console.error("Failed to load chats:", err);
                setError(err.message);
            });
    }, []);

    const handleSelectUser = async targetUser => {
        setIsSearchOpen(false);

        try {

            const myKeys = await getKeys(user.id);
            if (!myKeys) {
                alert("Thinking: No keys found for my user. Cannot start encrypted chat.");
                return;
            }

            if (!targetUser.publicKey) {
                alert("Target user has no public key. Cannot start encrypted chat. (They might be an old user)");
                return;
            }

            const targetPubKey = await importKey(targetUser.publicKey, "public");

            const myPubKey = myKeys.publicKey;

            const sessionKey = await generateSessionKey();

            const encForTarget = await encryptSessionKey(sessionKey, targetPubKey);

            const encForMe = await encryptSessionKey(sessionKey, myPubKey);

            const encryptedKeys = {
                [targetUser._id]: encForTarget,
                [user.id]: encForMe,
            };

            const res = await fetch(`${API_URL}/api/chats`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds: [targetUser._id],
                    name: targetUser.username,
                    encryptedKeys,
                }),
                credentials: "include",
            });

            const data = await res.json();
            if (data.success) {
                setChats(prev => {
                    if (prev.find(c => c._id === data.chat._id)) return prev;
                    return [data.chat, ...prev];
                });
                setSelectedChat(data.chat._id);
            } else {
                alert("Failed to create chat: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Error creating chat: " + err.message);
        }
    };

    if (error) return <div style={{ padding: "1em", color: "red" }}>Error: {error}</div>;

    return (
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <h3>Chats</h3>
                <button onClick={() => setIsSearchOpen(true)} className="auth-button" style={{ width: "auto", padding: "0.4rem 0.8rem", marginTop: 0 }}>
                    +
                </button>
            </div>

            <div className="sidebar-list">
                {!chats.length && <div style={{ padding: "1em", color: "var(--text-muted)" }}>No chats yet.</div>}
                {chats.map(chat => (
                    <div
                        key={chat._id}
                        onClick={() => setSelectedChat(chat._id)}
                        className={`chat-item ${selectedChat === chat._id ? "active" : ""}`}
                    >
                        {chat.name || "Private Chat"}
                    </div>
                ))}
            </div>

            <div style={{ padding: "1em", borderTop: "1px solid var(--border-color)" }}>
                <Logout />
            </div>

            {isSearchOpen && <UserSearchModal onClose={() => setIsSearchOpen(false)} onSelectUser={handleSelectUser} />}
        </div>
    );
}
