import { useState } from "react";
import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Header } from "./Header";
import { useLocation } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard Overview",
  "/admin/users": "User Management",
  "/admin/vendors": "Vendor Management",
  "/admin/orders": "Order Monitoring",
  "/admin/reports": "Reports & Analytics",
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const title = pageTitles[location.pathname] ?? "Admin Dashboard"; // Fallback for unmatched paths

  const handleToggle = () => setCollapsed((prev) => !prev);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
