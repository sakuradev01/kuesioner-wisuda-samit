import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { session } from "../auth/session";
import "./HomePage.css";

const menu = [
  { key: "nomination", label: "Nominasi Sensei Terbaik", to: "/questionnaire/nominations", icon: "🔐" },
  { key: "dreams", label: "Harapan Wisudawan", to: "/questionnaire/dreams", icon: "🎓" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = session.getUser();
  const displayName = (user?.name && user.name.trim()) ? user.name : (user?.uuid || "Wisudawan");

  useEffect(() => {
    const token = session.getToken();

    const load = async () => {
      try {
        const res = await fetch("http://localhost:3002/api/wisuda/status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // kalau token invalid/expired, lempar balik ke login
        if (res.status === 401) {
          session.clearAll();
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();
        setStatus(data);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const handleLogout = () => {
    session.clearAll();
    navigate("/", { replace: true });
  };

  const isDoneNom = status?.isDone_nomination === 1;
  const isDoneDreams = status?.isDone_dreams === 1;

  const isDisabled = (key) => {
    if (key === "nomination") return isDoneNom;
    if (key === "dreams") return isDoneDreams;
    return false;
  };

  return (
    <div className="lt-page">
      {/* ✅ tulisan di atas card */}
      <div className="lt-welcome">
        <div className="lt-welcome-title">Selamat datang, {displayName} 👋</div>
        <div className="lt-welcome-sub">Silakan pilih menu kuesioner di bawah ini.</div>
      </div>

      <div className="lt-card">
        <div className="lt-header">
          <div className="lt-logo">
            <img src="/logo.png" alt="Samit Logo" className="lt-logo-img" />
          </div>
          <div className="lt-handle">Questionnaire</div>
        </div>

        <div className="lt-list">
          {menu.map((item) => {
            const disabled = isDisabled(item.key);

            if (disabled) {
              return (
                <div key={item.label} className="lt-item lt-item-disabled" aria-disabled="true">
                  <span className="lt-icon">{item.icon}</span>
                  <span className="lt-text">{item.label}</span>
                  <span className="lt-more">✅</span>
                </div>
              );
            }

            return (
              <Link key={item.label} to={item.to} className="lt-item">
                <span className="lt-icon">{item.icon}</span>
                <span className="lt-text">{item.label}</span>
                <span className="lt-more">{loading ? "…" : "⋮"}</span>
              </Link>
            );
          })}
        </div>

        <button type="button" className="lt-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
