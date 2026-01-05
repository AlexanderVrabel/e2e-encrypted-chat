import { useState } from "react";

export default function MessageInput({ onSend }) {
    const [text, setText] = useState("");

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText("");
    };

    return (
        <div className="input-area">
            <input
                className="chat-input"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
            />
            <button className="send-button" onClick={handleSend}>
                ➤
            </button>
        </div>
    );
}
