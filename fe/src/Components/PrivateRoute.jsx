import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user){
return <Navigate to="/login"/>;


  }
  if (adminOnly && !user.is_admin) {
    return <Navigate to="/" />;
  }
 
  return children;
}
