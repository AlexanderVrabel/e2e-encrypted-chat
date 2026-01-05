import { useState } from "react";
import { generateKeyPair, exportKey } from "../utils/crypto";
import { saveKeys } from "../utils/keyStorage";

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    async function sendRegister() {
        try {

            const keyPair = await generateKeyPair();
            const publicKeyJwk = await exportKey(keyPair.publicKey);

            const payload = { email, password, username, publicKey: publicKeyJwk };

            const response = await fetch(`${API_URL}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            console.log(result);

            if (!response.ok) {
                console.error("Server error:", result.error);
                alert("Registration failed: " + result.error);
            } else {

                console.log("Registered successfully");
                alert("Registered! Please login.");

                await saveKeys(email, keyPair);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    return (
        <div className="auth-form">
            <input
                className="auth-input"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email Address"
                required
            />
            <input
                className="auth-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                required
            />
            <input
                className="auth-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <button className="auth-button" onClick={sendRegister}>
                Create Account
            </button>
        </div>
    );
}

export default Register;
