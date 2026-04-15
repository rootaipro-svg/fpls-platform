"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, LayoutDashboard, UserCircle2 } from "lucide-react";

function itemClass(active: boolean) {
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
      <div className="mx-auto w-full max-w-screen-sm px-3 pb-28 pt-3">
        <header className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium leading-5 text-slate-500">
                منصة تفتيش أنظمة السلامة والحماية من الحريق
              </div>
              <div className="mt-1 text-lg font-bold leading-6 text-slate-900">
                FPLS Inspection Platform
              </div>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <UserCircle2 className="h-6 w-6" />
            </div>
          </div>
        </header>

        <main className="space-y-4">{children}</main>
      </div>

      <nav className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-20px)] max-w-screen-sm -translate-x-1/2 rounded-3xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur">
        <div className="grid grid-cols-3 gap-2">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={itemClass(item.active)}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
