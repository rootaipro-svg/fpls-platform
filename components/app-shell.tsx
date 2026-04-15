"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, LayoutDashboard, UserCircle2 } from "lucide-react";

function navItemClass(active: boolean) {
  return [
    "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition",
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  ].join(" ");
}

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
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-4">
        <header className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">
                منصة تفتيش أنظمة السلامة والحماية من الحريق
              </div>
              <div className="mt-1 truncate text-lg font-bold text-slate-900">
                FPLS Inspection Platform
              </div>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <UserCircle2 className="h-7 w-7" />
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-4">{children}</main>

        <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur">
          <div className="grid grid-cols-3 gap-2">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={navItemClass(item.active)}>
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
