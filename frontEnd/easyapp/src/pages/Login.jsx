import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { FaLock, FaSignInAlt, FaUser } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import "../css/login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn(formData);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError(
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-brand">
          <span>MISONE ERP</span>
          <strong>Secure sign in</strong>
        </div>

        <form className="login-panel" onSubmit={handleSubmit}>
          <h1>Login</h1>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label className="login-field">
            <span>Login ID</span>
            <div>
              <FaUser />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter login ID"
                autoComplete="username"
              />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div>
              <FaLock />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
          </label>

          <button className="login-button" type="submit" disabled={loading}>
            <FaSignInAlt />
            <span>{loading ? "Signing in..." : "Sign In"}</span>
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
