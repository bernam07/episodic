import { Navigate, Outlet } from "react-router-dom";
import { FullScreenSpinner } from "@/presentation/components/ui/Spinner";
import { useAuth } from "@/presentation/hooks/useAuth";

export function ProtectedRoute() {
  const { user, initialising } = useAuth();

  if (initialising) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
