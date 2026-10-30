"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  BarChart2, 
  Sparkles,
  Loader2,
  Menu,
  X
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // When pathname changes, navigation is complete, close mobile menu and reset loading
  useEffect(() => {
    setLoadingHref(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart2,
    },
  ];

  const handleClick = (href: string) => {
    if (pathname !== href) {
      setLoadingHref(href);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE/TABLET: TOP HEADER WITH HAMBURGER BUTTON (lg:hidden) */}
      {/* ============================================================ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 px-4 flex items-center justify-between select-none shadow-xs">
        {/* Brand Header */}
        <Link 
          href="/" 
          onClick={() => handleClick("/")}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight block leading-tight">
              AgentOps
            </span>
            <span className="text-[10px] text-slate-500 font-semibold block">
              Smart Operations
            </span>
          </div>
        </Link>

        {/* Hamburger Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-slate-900" />
          ) : (
            <Menu className="w-5 h-5 text-slate-900" />
          )}
        </button>
      </header>

      {/* ============================================================ */}
      {/* 2. MOBILE TOP-DOWN DROPDOWN MENU (Jo Upar Se Niche Khulta Hai) */}
      {/* ============================================================ */}
      {/* Backdrop overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/25 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Dropdown Container (Slides down from top) */}
      <div
        className={`lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-40 transition-all duration-300 ease-in-out transform ${
          isMobileMenuOpen
            ? "translate-y-0 opacity-100 visible"
            : "-translate-y-4 opacity-0 invisible pointer-events-none"
        }`}
      >
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isLoading = loadingHref === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleClick(item.href)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"} shrink-0`} />
                )}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info Footer in Mobile Dropdown */}
        <div className="p-3 mx-4 mb-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              AC
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Alex Chen</div>
              <div className="text-[10px] text-slate-500 font-medium">SRE Engineer</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DESKTOP: FIXED SIDEBAR (hidden lg:flex)                   */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen fixed left-0 top-0 z-40 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100">
          <Link 
            href="/" 
            onClick={() => handleClick("/")}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">
                AgentOps
              </span>
              <p className="text-xs text-slate-500 font-medium">Smart Operations</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isLoading = loadingHref === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleClick(item.href)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"} shrink-0`} />
                )}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Simple User Footer */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              AC
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Alex Chen</div>
              <div className="text-[11px] text-slate-500">Engineer</div>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
        </div>
      </aside>
    </>
  );
}
