import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface RequireAdminProps {
  children: ReactNode;
}

const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { isLoaded, isAdmin } = useIsAdmin();

  if (!isLoaded) {
    return null;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAdmin;
