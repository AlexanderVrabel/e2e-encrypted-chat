import { useState } from "react";
import { useUser } from "../UserContext";
import { getKeys, saveKeys } from "../utils/keyStorage";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { setUser } = useUser();
    async function sendLogin() {
        const payload = { email, password };

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            console.log(result);

            if (!response.ok) {
                console.error("Server error:", result.error);
                alert("Login failed: " + result.error);
            } else {
                console.log("logged in", result.user);


                const userEmail = result.user.email;
                const userId = result.user.id;


                let keys = await getKeys(userId);

                if (!keys) {

                    keys = await getKeys(userEmail);
                    if (keys) {
                        console.log("Migrating keys from email to userId...");
                        await saveKeys(userId, keys);

                    } else {
                        alert("WARNING: No encryption keys found on this device. You will not be able to decrypt old messages.");

                    }
                }


                setUser(result.user);
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
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <button className="auth-button" onClick={sendLogin}>
                Login
            </button>
        </div>
    );
}

export default Login;
