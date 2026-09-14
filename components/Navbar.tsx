"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCabang } from "@/lib/CabangContext";
import { useAuth } from "@/lib/AuthContext";
import { useTour } from "@/lib/TourContext";
import { useLanguage } from "@/lib/LanguageContext";
import {
  ClipboardCheck,
  Package,
  Users,
  Building2,
  FileText,
  BarChart3,
  Store,
  ChevronDown,
  Home,
  LogOut,
  HelpCircle,
  Globe,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type UserRole = "admin" | "petugas";

interface NavItem {
  name: string;
  nameEn?: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

const bottomNavItems: NavItem[] = [
  { name: "Beranda", nameEn: "Home", href: "/", icon: Home },
  { name: "Input SO", nameEn: "Input SO", href: "/so/input", icon: ClipboardCheck },
  { name: "Laporan", nameEn: "Reports", href: "/laporan", icon: FileText },
  { name: "Item", nameEn: "Items", href: "/master-item", icon: Package, roles: ["admin"] },
  { name: "Panduan", nameEn: "Docs", href: "/docs", icon: BookOpen },
  { name: "Lainnya", nameEn: "More", href: "/cabang", icon: Building2, roles: ["admin"] },
  { name: "Tutor", nameEn: "Tutor", href: "/tutorial", icon: HelpCircle },
  { name: "Keluar", nameEn: "Logout", href: "/logout", icon: LogOut },
];

const desktopCoreItems: NavItem[] = [
  { name: "Dashboard", nameEn: "Dashboard", href: "/dashboard/harian", icon: BarChart3, roles: ["admin"] },
  { name: "Input SO", nameEn: "Input SO", href: "/so/input", icon: ClipboardCheck },
  { name: "Laporan", nameEn: "Reports", href: "/laporan", icon: FileText },
  { name: "Panduan", nameEn: "Docs", href: "/docs", icon: BookOpen },
];

const adminMenuItems: NavItem[] = [
  { name: "Master Item", nameEn: "Items", href: "/master-item", icon: Package },
  { name: "Petugas", nameEn: "Staff", href: "/petugas", icon: Users },
  { name: "Cabang", nameEn: "Branches", href: "/cabang", icon: Building2 },
];

export function Navbar() {
  const pathname = usePathname();
  const { selectedCabang, cabangList, setSelectedCabang } = useCabang();
  const { user, logout } = useAuth();
  const { openTour } = useTour();
  const { lang, toggleLang } = useLanguage();
  const role = user?.role || "petugas";

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  const isVisible = (item: NavItem) => !item.roles || item.roles.includes(role);

  const filteredDesktop = desktopCoreItems.filter(isVisible);
  const filteredBottom = bottomNavItems.filter(isVisible);
  const showAdminMenu = role === "admin";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isAdminMenuActive = adminMenuItems.some((item) => isActive(item.href));

  useEffect(() => {
    if (!adminMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [adminMenuOpen]);

  return (
    <>
      {/* Top Header - Desktop */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-base-100/85 border-b border-base-300 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
            >
              <img
                src="/logo.jpg"
                alt="Stokis"
                className="w-8 h-8 rounded-lg object-cover shadow-sm"
              />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold tracking-tight text-base-content">
                  STOKIS
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase mt-0.5 text-base-content/50">
                  {lang === 'en' ? 'Operations' : 'Operasional'}
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav data-onboard="nav" className="hidden md:flex items-center gap-0.5">
              {filteredDesktop.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const label = lang === 'en' && item.nameEn ? item.nameEn : item.name;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </Link>
                );
              })}

              {/* Admin Hamburger Menu */}
              {showAdminMenu && (
                <div ref={adminMenuRef} className="relative">
                  <button
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                      adminMenuOpen || isAdminMenuActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'
                    }`}
                    title={lang === 'en' ? 'Management' : 'Pengelolaan'}
                  >
                    {adminMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
                    <span>{lang === 'en' ? 'Management' : 'Pengelolaan'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${adminMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {adminMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-base-100 border border-base-300 rounded-lg shadow-lg py-1 z-50">
                      {adminMenuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        const label = lang === 'en' && item.nameEn ? item.nameEn : item.name;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            prefetch={false}
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors ${
                              active
                                ? 'bg-primary/10 text-primary'
                                : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors duration-150 text-base-content/80 bg-base-200 hover:bg-base-300 font-mono text-xs font-bold border border-base-300"
                title={lang === 'id' ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{lang.toUpperCase()}</span>
              </button>

              {/* Branch Selector */}
              <div data-onboard="cabang" className="flex items-center rounded-md px-2.5 py-1.5 bg-base-200 border border-base-300 max-w-[160px] sm:max-w-none">
                <Store className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-primary" />
                <select
                  value={selectedCabang?.Cabang_ID || ""}
                  disabled={cabangList.length <= 1}
                  onChange={(e) => {
                    const match = cabangList.find((c) => c.Cabang_ID === e.target.value);
                    if (match) setSelectedCabang(match);
                  }}
                  className="bg-transparent text-xs font-semibold focus:outline-none pr-3 appearance-none border-none outline-none py-0 truncate cursor-pointer text-base-content"
                >
                  {cabangList.length === 0 ? (
                    <option value="">{lang === 'en' ? 'Select Branch...' : 'Pilih Cabang...'}</option>
                  ) : (
                    cabangList.map((c) => (
                      <option key={c.Cabang_ID} value={c.Cabang_ID}>
                        {c.Nama_Cabang}
                      </option>
                    ))
                  )}
                </select>
                {cabangList.length > 1 && (
                  <ChevronDown className="w-3 h-3 pointer-events-none -ml-2 text-base-content/50" />
                )}
              </div>

              {/* Tutorial */}
              <button
                onClick={openTour}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors duration-150 text-base-content/50 hover:text-primary hover:bg-primary/10"
                title={lang === 'en' ? 'View tutorial' : 'Lihat tutorial'}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold hidden sm:inline">{lang === 'en' ? 'Tutorial' : 'Tutorial'}</span>
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors duration-150 text-base-content/50 hover:text-error hover:bg-error/10"
                title={lang === 'en' ? 'Logout' : 'Keluar'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold hidden sm:inline">{lang === 'en' ? 'Logout' : 'Keluar'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav Bar */}
      <nav data-onboard="nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-base-100 border-t border-base-300 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-1 safe-area-pb">
          {filteredBottom.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isLogout = item.href === "/logout";
            const isTutorial = item.href === "/tutorial";
            if (isTutorial) {
              return (
                <button
                  key={item.name}
                  onClick={openTour}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors text-base-content/50 hover:text-primary"
                >
                  <div className="p-1.5 rounded-lg">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold">{item.name}</span>
                </button>
              );
            }
            return isLogout ? (
              <button
                key={item.name}
                onClick={logout}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors text-base-content/50 hover:text-error"
              >
                <div className="p-1.5 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors ${
                  active ? 'text-primary' : 'text-base-content/50'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-primary/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-primary' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
