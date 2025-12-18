import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { session } from "../auth/session";
import "./StudentLogin.css";

function StudentLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    session.clearAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3002/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("❌ " + (data.message || "Login gagal"));
        setIsLoading(false);
        return;
      }

      session.setToken(data.token);
      if (data.user) session.setUser(data.user);

      const to = location.state?.from?.pathname || "/questionnaire";

      navigate(to, { replace: true });
    } catch (err) {
      alert("❌ API tidak bisa dihubungi");
      setIsLoading(false);
    }
  };

  return (
    <div className="student-login-container">
      <div className="login-wrapper">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-header">
            <h2>🔐 Login</h2>
            <p>Selamat datang calon wisudawan</p>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Masukkan username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? "⏳ Memproses..." : "🚀 Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentLogin;
