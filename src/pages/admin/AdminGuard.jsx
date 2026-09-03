import { Navigate } from "react-router-dom";
import { getToken } from "../../lib/adminApi";

export default function AdminGuard({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}
