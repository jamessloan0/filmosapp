import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, FolderOpen, LogOut, Menu, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
];

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-zinc-900 text-sm tracking-tight">FilmOS</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 hidden sm:block">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout(true)}
              className="text-zinc-500 hover:text-zinc-900"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
