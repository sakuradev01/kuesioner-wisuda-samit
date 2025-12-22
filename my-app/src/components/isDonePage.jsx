import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { session } from "../auth/session";
import "./IsDonePage.css";

export default function IsDonePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = session.getUser?.() || null;

  // formName diambil dari state saat navigate() dari page form
  const formNameFromState = location.state?.formName;

  const formName = useMemo(() => {
    if (formNameFromState) return formNameFromState;

    // fallback kalau user reload / masuk langsung:
    // deteksi dari path
    const path = location.pathname || "";
    if (path.startsWith("/nominations")) return "Nominasi Sensei Terbaik";

    return "Form";
  }, [formNameFromState, location.pathname]);

  const studentName = useMemo(() => {
    // ini sudah dari DB (response login), jadi aman
    return user?.name || "Minna-san";
  }, [user?.name]);

  const logout = () => {
    session.clearAll?.();
    navigate("/", { replace: true });
  };

  return (
    <div className="done-page">
      <div className="done-card">
        <div className="done-badge">SAMIT</div>

        <h1 className="done-title">Selamat, {studentName} 🎉</h1>

        <p className="done-subtitle">
          Anda sudah mengisi form <b>{formName}</b>.
        </p>

        <div className="done-actions">
          <button type="button" className="done-btn" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="done-hint">
          * Halaman ini muncul setelah submit berhasil.
        </div>
      </div>
    </div>
  );
}
