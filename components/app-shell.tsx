"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldAlert,
  UserCircle2,
  Users,
  X,
} from "lucide-react";

type SessionData = {
  roleCode?: string;
  fullName?: string;
  email?: string;
};

function navItemClass(active: boolean) {
  return [
    "flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold transition",
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  ].join(" ");
}

function drawerLinkClass(active: boolean) {
  return [
    "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
    active
      ? "border border-teal-100 bg-teal-50 text-teal-700"
      : "border border-transparent text-slate-700 hover:bg-slate-50",
  ].join(" ");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ignore = false;

    fetch("/api/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json?.ok) {
          setSession(json.data || null);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuOpen || !panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  const role = String(session?.roleCode || "").toLowerCase();

  const bottomNav = useMemo(() => {
    if (role === "inspector") {
      return [
        {
          href: "/dashboard",
          label: "الرئيسية",
          icon: LayoutDashboard,
          active: pathname === "/dashboard",
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
        {
          href: "/reports",
          label: "التقارير",
          icon: FileText,
          active: pathname === "/reports" || pathname.startsWith("/reports/"),
        },
      ];
    }

    return [
      {
        href: "/dashboard",
        label: "الرئيسية",
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
      {
        href: "/reports",
        label: "التقارير",
        icon: FileText,
        active: pathname === "/reports" || pathname.startsWith("/reports/"),
      },
    ];
  }, [pathname, role]);

  const menuItems = useMemo(() => {
    if (role === "inspector") {
      return [
        { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
        { href: "/visits", label: "الزيارات", icon: ClipboardList },
        { href: "/findings", label: "المخالفات", icon: ShieldAlert },
        { href: "/reports", label: "التقارير", icon: FileText },
      ];
    }

    return [
      { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/facilities", label: "المنشآت", icon: Building2 },
      { href: "/visits", label: "الزيارات", icon: ClipboardList },
      { href: "/findings", label: "المخالفات", icon: ShieldAlert },
      { href: "/reports", label: "التقارير", icon: FileText },
      { href: "/inspectors", label: "إدارة المفتشين", icon: Users },
      { href: "/settings", label: "الإعدادات", icon: Settings },
    ];
  }, [role]);

  return (
    <div className="min-h-screen bg-slate-100 pb-24" dir="rtl">
      <div className="mx-auto max-w-md px-4 pt-4">
        <header className="relative mb-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-700"
              aria-label="فتح القائمة"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-teal-100 bg-teal-50 text-teal-700">
                <UserCircle2 size={32} />
              </div>

              <div className="text-right">
                <div className="text-[13px] leading-6 text-slate-500">
                  منصة تفتيش أنظمة السلامة والحماية من الحريق
                </div>
                <div className="text-[15px] font-extrabold text-slate-900">
                  FPLS Inspection Platform
                </div>
              </div>
            </div>
          </div>

          {menuOpen ? (
            <div className="absolute inset-x-0 top-[92px] z-50 px-2">
              <div
                ref={panelRef}
                className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-xl"
              >
                <div className="mb-3 rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <div className="text-sm font-bold text-slate-900">
                    {session?.fullName || "المستخدم"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {session?.email || "-"}
                  </div>
                </div>

                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={drawerLinkClass(active)}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span>{item.label}</span>
                        <Icon size={18} />
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                  >
                    <span>{loggingOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}</span>
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        {children}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-around gap-2 px-3 py-3">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={navItemClass(item.active)}>
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
