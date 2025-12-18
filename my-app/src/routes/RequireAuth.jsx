import { Navigate, Outlet, useLocation } from "react-router-dom";
import { session } from "../auth/session";

export default function RequireAuth() {
  const token = session.getToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
