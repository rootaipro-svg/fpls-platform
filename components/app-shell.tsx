"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  ShieldAlert,
  UserCircle2,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

type SessionData = {
  roleCode?: string;
  fullName?: string;
  email?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function drawerLinkClass(active: boolean) {
  return [
    "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition",
    active
      ? "border-teal-200 bg-teal-50 text-teal-700"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ].join(" ");
}

function DrawerSectionBlock({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  onNavigate: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="px-1 text-sm font-bold text-slate-500">{title}</div>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={drawerLinkClass(item.active)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-2xl border",
                    item.active
                      ? "border-teal-200 bg-teal-100 text-teal-700"
                      : "border-slate-200 bg-slate-50 text-slate-500",
                  ].join(" ")}
                >
                  <Icon size={20} />
                </div>

                <div className="text-base font-semibold">{item.label}</div>
              </div>

              <div className="text-xs font-bold text-slate-400">
                {item.active ? "الحالية" : ""}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

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

  const navSections = useMemo<NavSection[]>(() => {
    const role = String(session?.roleCode || "").toLowerCase();

    if (role === "inspector") {
      return [
        {
          title: "التنقل الرئيسي",
          items: [
            {
              href: "/dashboard",
              label: "لوحة التحكم",
              icon: LayoutDashboard,
              active: isActivePath(pathname, "/dashboard"),
            },
            {
              href: "/visits",
              label: "الزيارات",
              icon: ClipboardList,
              active: isActivePath(pathname, "/visits"),
            },
            {
              href: "/assets",
              label: "الأصول",
              icon: Boxes,
              active: isActivePath(pathname, "/assets"),
            },
            {
              href: "/findings",
              label: "المخالفات",
              icon: ShieldAlert,
              active: isActivePath(pathname, "/findings"),
            },
            {
              href: "/reports",
              label: "التقارير",
              icon: FileText,
              active: isActivePath(pathname, "/reports"),
            },
          ],
        },
        {
          title: "أدوات إضافية",
          items: [
            {
              href: "/assets/labels",
              label: "ملصقات QR",
              icon: QrCode,
              active: isActivePath(pathname, "/assets/labels"),
            },
          ],
        },
      ];
    }

    return [
      {
        title: "التنقل الرئيسي",
        items: [
          {
            href: "/dashboard",
            label: "لوحة التحكم",
            icon: LayoutDashboard,
            active: isActivePath(pathname, "/dashboard"),
          },
          {
            href: "/facilities",
            label: "المنشآت",
            icon: Building2,
            active: isActivePath(pathname, "/facilities"),
          },
          {
            href: "/assets",
            label: "الأصول",
            icon: Boxes,
            active: isActivePath(pathname, "/assets"),
          },
          {
            href: "/visits",
            label: "الزيارات",
            icon: ClipboardList,
            active: isActivePath(pathname, "/visits"),
          },
          {
            href: "/findings",
            label: "المخالفات",
            icon: ShieldAlert,
            active: isActivePath(pathname, "/findings"),
          },
          {
            href: "/reports",
            label: "التقارير",
            icon: FileText,
            active: isActivePath(pathname, "/reports"),
          },
        ],
      },
      {
        title: "التشغيل والإدارة",
        items: [
          {
            href: "/unassigned-visits",
            label: "توزيع المهام",
            icon: Users,
            active: isActivePath(pathname, "/unassigned-visits"),
          },
          {
            href: "/assets/labels",
            label: "ملصقات QR",
            icon: QrCode,
            active: isActivePath(pathname, "/assets/labels"),
          },
          {
            href: "/inspectors",
            label: "إدارة المفتشين",
            icon: UserCircle2,
            active: isActivePath(pathname, "/inspectors"),
          },
          {
            href: "/settings/users",
            label: "المستخدمون والصلاحيات",
            icon: Users,
            active: isActivePath(pathname, "/settings/users"),
          },
          {
            href: "/settings",
            label: "الإعدادات",
            icon: Settings,
            active: isActivePath(pathname, "/settings"),
          },
        ],
      },
    ];
  }, [pathname, session?.roleCode]);

  const displayName =
    session?.fullName || session?.email || "مستخدم النظام";

  const roleLabel =
    String(session?.roleCode || "").toLowerCase() === "inspector"
      ? "مفتش"
      : "مدير / مشرف";

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <div className="mx-auto max-w-md px-4 pt-4 pb-6">
        <div className="mb-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
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

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
              aria-label="فتح القائمة"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {children}
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/35"
          />

          <aside className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex min-h-full flex-col">
              <div className="border-b border-slate-200 px-4 py-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-500">
                      القائمة الرئيسية
                    </div>
                    <div className="text-lg font-extrabold text-slate-900">
                      FPLS Inspection Platform
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                    aria-label="إغلاق"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700">
                      <UserCircle2 size={30} />
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {displayName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {roleLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-6 px-4 py-4">
                {navSections.map((section) => (
                  <DrawerSectionBlock
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
              </div>

              <div className="border-t border-slate-200 px-4 py-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-base font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                >
                  <LogOut size={18} />
                  {loggingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
