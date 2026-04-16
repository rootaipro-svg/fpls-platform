"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  ShieldAlert,
  UserCircle2,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const nav = [
    {
      href: "/dashboard",
      label: "لوحة التحكم",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/facilities",
      label: "المنشآت",
      icon: Building2,
      active: pathname === "/facilities" || pathname.startsWith("/facilities/"),
    },
    {
      href: "/visits",
      label: "الزيارات",
      icon: ClipboardList,
      active: pathname === "/visits" || pathname.startsWith("/visits/"),
    },
    {
      href: "/findings",
      label: "المخالفات",
      icon: ShieldAlert,
      active: pathname === "/findings" || pathname.startsWith("/findings/"),
    },
  ];

  return (
    <div dir="rtl">
      <div className="page-wrap">
        <header className="app-shell-header">
          <div className="app-shell-header-row">
            <div className="app-shell-brand">
              <div className="app-shell-brand-top">
                منصة تفتيش أنظمة السلامة والحماية من الحريق
              </div>
              <div className="app-shell-brand-title">
                FPLS Inspection Platform
              </div>
            </div>

            <div className="user-badge">
              <UserCircle2 size={26} />
            </div>
          </div>
        </header>

        <main className="stack-4">{children}</main>
      </div>

      <nav className="bottom-nav">
        <div className="bottom-nav-grid">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bottom-nav-link ${item.active ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
