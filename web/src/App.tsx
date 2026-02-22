import { Suspense, useEffect, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ViewerLayout } from "@/components/layout/ViewerLayout";
import AOS from "aos";
import "aos/dist/aos.css";
import { Loader2 } from "lucide-react";

/* -----------------------------
   Lazy-loaded Pages
-------------------------------- */

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const Applications = lazy(() => import("@/pages/admin/Applications"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const VendorManagement = lazy(() => import("@/pages/VendorManagement"));
const RiderManagement = lazy(() => import("@/pages/RiderManagement"));
const OrderMonitoring = lazy(() => import("@/pages/OrderMonitoring"));
const ReportsAnalytics = lazy(() => import("@/pages/ReportsAnalytics"));

const ViewerDashboard = lazy(() => import("@/pages/viewer/ViewerDashboard"));
const ViewerReports = lazy(() => import("@/pages/viewer/ViewerReports"));

const NotFound = lazy(() => import("@/pages/NotFound"));

/* -----------------------------
   Shared Loader
-------------------------------- */

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

/* -----------------------------
   Root Redirect
-------------------------------- */

function RootRedirect() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={role === "admin" ? "/admin" : "/viewer"} replace />;
  }

  return <LandingPage />;
}

/* -----------------------------
   Routes
-------------------------------- */

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <Applications />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vendors"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <VendorManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <OrderMonitoring />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/riders"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <RiderManagement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout>
                <ReportsAnalytics />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Viewer */}
        <Route
          path="/viewer"
          element={
            <ProtectedRoute allowedRole="viewer">
              <ViewerLayout>
                <ViewerDashboard />
              </ViewerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/viewer/reports"
          element={
            <ProtectedRoute allowedRole="viewer">
              <ViewerLayout>
                <ViewerReports />
              </ViewerLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

/* -----------------------------
   App Root
-------------------------------- */

export default function App() {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800,
      easing: "ease-out-cubic",
      offset: 80,
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
