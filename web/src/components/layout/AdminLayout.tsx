import { useState, useEffect } from "react";
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
  "/admin/applications": "Applications Management",
  "/admin/vendors": "Vendor Management",
  "/admin/riders": "Rider Management",
  "/admin/orders": "Order Monitoring",
  "/admin/reports": "Reports & Analytics",
  "/admin/user-reports": "User Reports",
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(256);

  const title = pageTitles[location.pathname] || "Admin Dashboard";

  useEffect(() => {
    const handleResize = () => {
      const sidebar = document.querySelector("aside");
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth);
      }
    };

    handleResize();

    const observer = new MutationObserver(handleResize);
    const sidebar = document.querySelector("aside");
    if (sidebar) {
      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    window.addEventListener("resize", handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div
        className="transition-all duration-300 ease-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <Header title={title} />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
