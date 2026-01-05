import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import ChatPage from "./ChatPage";
import LoginPage from "./LoginPage";
import PrivateRoute from "./PrivateRoute";
import { useUser } from "./UserContext.jsx";

function App() {
    const { user } = useUser();
    const location = useLocation();

    return (
        <Routes location={location} key={location.pathname}>

            <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />


            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <ChatPage user={user} />
                    </PrivateRoute>
                }
            />
        </Routes>
    );
}

export default App;
