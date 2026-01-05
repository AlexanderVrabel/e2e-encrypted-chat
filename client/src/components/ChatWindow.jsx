import { useEffect, useRef } from "react";

export default function ChatWindow({ messages, user }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="message-list">
            {messages.map((msg, i) => {
                const isMine = msg.senderId === user.id;
                return (
                    <div
                        key={i}
                        className={`message-bubble ${isMine ? "mine" : "theirs"}`}
                    >
                        <span className="message-sender">{msg.senderName || "Unknown"}</span>
                        {msg.content}
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
