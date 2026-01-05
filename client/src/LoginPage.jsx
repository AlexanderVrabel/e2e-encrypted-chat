import { useState } from "react";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-header">{isLogin ? "Welcome Back" : "Create Account"}</h1>

                {isLogin ? <Login /> : <Register />}

                <div className="auth-toggle">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Register" : "Login"}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
