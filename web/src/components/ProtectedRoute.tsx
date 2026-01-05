import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: "admin" | "viewer";
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user's role doesn't match the allowed role, redirect to their correct dashboard
  if (role !== allowedRole) {
    const correctPath = role === "admin" ? "/admin" : "/viewer";
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}
