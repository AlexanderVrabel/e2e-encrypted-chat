import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "./UserContext.jsx";

export default function PrivateRoute({ children }) {
    const { user, loading } = useUser();
    const location = useLocation();

    if (loading) {

        return null;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
