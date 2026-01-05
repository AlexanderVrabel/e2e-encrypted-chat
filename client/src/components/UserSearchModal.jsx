import { useState } from "react";
import "./UserSearchModal.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function UserSearchModal({ onClose, onSelectUser }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async e => {
        const q = e.target.value;
        setQuery(q);

        if (q.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users/search?q=${encodeURIComponent(q)}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (Array.isArray(data)) setResults(data);
            else setResults([]);
        } catch (err) {
            console.error("Search failed:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>New Chat</h3>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <input
                    type="text"
                    className="search-input"
                    placeholder="Search users by name..."
                    value={query}
                    onChange={handleSearch}
                    autoFocus
                />

                {loading && <div style={{ textAlign: "center", color: "#666" }}>Searching...</div>}

                {!loading && results.length === 0 && query.length >= 2 && (
                    <div style={{ textAlign: "center", color: "#666" }}>No users found</div>
                )}

                <div className="results-list">
                    {results.map(user => (
                        <div key={user._id} onClick={() => onSelectUser(user)} className="user-item">
                            <span className="user-username">{user.username}</span>
                            <span className="user-email">{user.email}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
