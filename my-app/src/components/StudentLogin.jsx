import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { session } from "../auth/session";
import "./StudentLogin.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3003";

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
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert("❌ " + (data.message || "Login gagal"));
        setIsLoading(false);
        return;
      }

      // ✅ simpan sesi student
      session.setToken(data.token);
      session.setRole("student");
      if (data.user) session.setUser(data.user);

      // ✅ cek status dulu (biar kalau sudah isi, langsung ke done)
      let status = null;
      try {
        const st = await fetch(`${API_BASE}/api/wisuda/status`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (st.ok) status = await st.json().catch(() => null);
      } catch {
        // ignore
      }

      // jika sudah done nomination => ke done
      if (status?.isDone_nomination === 1 || status?.isDone_nomination === true) {
        navigate("/nominations/done", {
          replace: true,
          state: { formName: "Nominasi Sensei Terbaik" },
        });
        return;
      }

      // default: balik ke route tujuan atau nominations
      const to = location.state?.from?.pathname || "/nominations";
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
            <p>Selamat datang para wisudawan</p>
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
