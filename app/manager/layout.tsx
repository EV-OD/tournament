"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Settings, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ManagerLayoutProps {
  children: React.ReactNode;
}

const ManagerLayout = ({ children }: ManagerLayoutProps) => {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">You must be logged in as a manager.</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      href: "/manager/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/manager/bookings",
      label: "Bookings",
      icon: Calendar,
    },
    {
      href: "/manager/venue-settings",
      label: "My Venue",
      icon: Settings,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white border-r border-gray-200",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {sidebarOpen && (
              <h2 className="text-lg font-semibold text-gray-800">
                Manager Panel
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-green-50 text-green-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default ManagerLayout;
