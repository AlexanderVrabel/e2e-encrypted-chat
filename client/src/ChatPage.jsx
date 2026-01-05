import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import Sidebar from "./components/Sidebar";
import { decryptMessage, decryptSessionKey, encryptMessage } from "./utils/crypto";
import { getKeys } from "./utils/keyStorage";
const API_URL = import.meta.env.VITE_API_URL;

export default function ChatPage({ user }) {
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [sessionKey, setSessionKey] = useState(null);
    const socketRef = useRef();


    useEffect(() => {
        socketRef.current = io(API_URL, { withCredentials: true });

        socketRef.current.on("receiveMessage", async msg => {
            if (msg.chatId === selectedChat) {
                if (msg.senderId === user.id) return;

                let content = msg.content;
                if (msg.iv && sessionKey) {
                    try {
                        content = await decryptMessage({ iv: msg.iv, content: msg.content }, sessionKey);
                    } catch (e) {
                        content = "Decryption Error";
                    }
                }
                setMessages(prev => [...prev, { ...msg, content }]);
            }
        });

        return () => socketRef.current.disconnect();
    }, [selectedChat, sessionKey]);


    useEffect(() => {
        if (!selectedChat) {
            setMessages([]);
            setSessionKey(null);
            return;
        }

        async function initChat() {
            try {
                const chatRes = await fetch(`${API_URL}/api/chats/${selectedChat}`, { credentials: "include" });
                const chat = await chatRes.json();

                let sKey = null;
                if (chat.encryptedKeys && chat.encryptedKeys[user.id]) {
                    const myKeys = await getKeys(user.id);
                    if (myKeys) {
                        sKey = await decryptSessionKey(chat.encryptedKeys[user.id], myKeys.privateKey);
                        setSessionKey(sKey);
                    }
                } else {
                    setSessionKey(null);
                }

                const msgRes = await fetch(`${API_URL}/api/messages/${selectedChat}`, { credentials: "include" });
                const msgs = await msgRes.json();

                const decryptedMsgs = await Promise.all(
                    msgs.map(async msg => {
                        if (msg.iv && sKey) {

                            try {
                                const params = { iv: msg.iv, content: msg.content };
                                const text = await decryptMessage(params, sKey);
                                return { ...msg, content: text };
                            } catch (e) {
                                return { ...msg, content: "Decryption Failed" };
                            }
                        }
                        return msg;
                    })
                );

                setMessages(decryptedMsgs);

                socketRef.current.emit("joinChat", selectedChat);
            } catch (err) {
                console.error(err);
            }
        }

        initChat();
    }, [selectedChat]);

    const sendMessage = async content => {
        if (!selectedChat || !content) return;

        let msgPayload = {
            chatId: selectedChat,
            senderId: user.id,
            content,
            senderName: user.username,
        };

        if (sessionKey) {
            const encrypted = await encryptMessage(content, sessionKey);
            msgPayload = {
                ...msgPayload,
                content: encrypted.content,
                iv: encrypted.iv,
            };
        }

        socketRef.current.emit("sendMessage", msgPayload);


        setMessages(prev => [
            ...prev,
            {
                ...msgPayload,
                content: content,
                timestamp: new Date(),
            },
        ]);
    };

    return (
        <div className="chat-layout">
            <Sidebar selectedChat={selectedChat} setSelectedChat={setSelectedChat} user={user} />
            <div className="chat-main">
                <ChatWindow messages={messages} user={user} />
                <MessageInput onSend={sendMessage} />
            </div>
        </div>
    );
}
