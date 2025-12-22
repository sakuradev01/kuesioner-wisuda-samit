import { Navigate, Outlet, useLocation } from "react-router-dom";
import { session } from "../auth/session";

export default function RequireAuth({ role }) {
  const location = useLocation();

  const token = session.getToken();
  const savedRole = session.getRole(); // "student" | "admin"

  // Student pages: wajib token + role student
  if (role === "student") {
    if (!token || savedRole !== "student") {
      return <Navigate to="/" replace state={{ from: location }} />;
    }
    return <Outlet />;
  }

  // Admin pages: gak pakai token, tapi wajib role admin (dari login admin)
  if (role === "admin") {
    if (savedRole !== "admin") {
      return <Navigate to="/admin" replace state={{ from: location }} />;
    }
    return <Outlet />;
  }

  // fallback
  if (!token) return <Navigate to="/" replace state={{ from: location }} />;
  return <Outlet />;
}
