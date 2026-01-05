import { useUser } from "./UserContext.jsx";
import Logout from "./components/Logout.jsx";
function HomePage() {
    const { user, loading } = useUser();
    return (
        <>
            <p>{user ? user.username : "Not logged in"}</p>
            <Logout />
        </>
    );
}
export default HomePage;
