import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ViewerSidebar } from "./ViewerSidebar";
import { Header } from "./Header";
import { useLocation } from "react-router-dom";

interface ViewerLayoutProps {
  children: ReactNode;
}

const pageTitles: Record<string, string> = {
  "/viewer": "Dashboard Overview",
  "/viewer/reports": "Reports & Analytics",
};

export function ViewerLayout({ children }: ViewerLayoutProps) {
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(256);

  const title = pageTitles[location.pathname] || "Viewer Dashboard";

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
      <ViewerSidebar />
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
