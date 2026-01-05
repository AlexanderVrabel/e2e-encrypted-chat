import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext.jsx";

const API_URL = import.meta.env.VITE_API_URL;

function Logout() {
    const { setUser } = useUser();
    const navigate = useNavigate();

    async function sendLogout() {
        try {
            const res = await fetch(`${API_URL}/api/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (res.ok) {
                setUser(null);
                navigate("/login");
            } else {
                console.error("Logout failed");
            }
        } catch (err) {
            console.error("Error logging out:", err);
        }
    }

    return (
        <button
            className="auth-button"
            onClick={sendLogout}
            style={{ backgroundColor: "#fa5252", marginTop: 0 }}
        >
            Logout
        </button>
    );
}

export default Logout;
