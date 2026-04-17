"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  UserCircle2,
} from "lucide-react";

type SessionData = {
  roleCode?: string;
  fullName?: string;
  email?: string;
};

function itemClass(active: boolean) {
  return [
    "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition min-w-[72px]",
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  ].join(" ");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

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

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/";
    }
  }

  const nav = useMemo(() => {
    const role = String(session?.roleCode || "").toLowerCase();

    if (role === "inspector") {
      return [
        {
          href: "/dashboard",
          label: "لوحة التحكم",
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
      {
        href: "/reports",
        label: "التقارير",
        icon: FileText,
        active: pathname === "/reports" || pathname.startsWith("/reports/"),
      },
    ];
  }, [pathname, session?.roleCode]);

  return (
    <div className="min-h-screen bg-slate-100 pb-28" dir="rtl">
      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="mb-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            >
              <LogOut size={16} />
              {loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[13px] text-slate-500">
                  منصة تفتيش أنظمة السلامة والحماية من الحريق
                </div>
                <div className="text-[15px] font-bold text-slate-900">
                  FPLS Inspection Platform
                </div>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700">
                <UserCircle2 size={30} />
              </div>
            </div>
          </div>
        </div>

        {children}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-around gap-2 px-3 py-3">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={itemClass(item.active)}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
