import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  Clock3,
  QrCode,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

function daysBetween(today: Date, target: Date) {
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function parseAllowedSystems(value: any) {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sortByDueDateAsc(rows: any[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.next_due_date || 0)).getTime();
    const bTime = new Date(String(b?.next_due_date || 0)).getTime();
    return aTime - bTime;
  });
}

function getDueLabel(daysDiff: number) {
  if (daysDiff < 0) return "متأخر";
  if (daysDiff === 0) return "اليوم";
  if (daysDiff <= 7) return "قريب";
  return "مستقبلي";
}

function toneStyles(tone: "teal" | "amber" | "red" | "slate") {
  const map = {
    teal: {
      iconBg: "#ecfeff",
      iconColor: "#0f766e",
      iconBorder: "1px solid #ccfbf1",
    },
    amber: {
      iconBg: "#fffbeb",
      iconColor: "#b45309",
      iconBorder: "1px solid #fde68a",
    },
    red: {
      iconBg: "#fef2f2",
      iconColor: "#b91c1c",
      iconBorder: "1px solid #fecaca",
    },
    slate: {
      iconBg: "#f8fafc",
      iconColor: "#475569",
      iconBorder: "1px solid #e2e8f0",
    },
  };

  return map[tone];
}

function CompactStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: any;
  tone?: "teal" | "amber" | "red" | "slate";
}) {
  const theme = toneStyles(tone);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.iconBg,
            color: theme.iconColor,
            border: theme.iconBorder,
            flexShrink: 0,
          }}
        >
          <Icon size={26} />
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-2 text-5xl font-extrabold leading-none text-slate-950">
            {value}
          </div>
          <div className="mt-2 text-xs leading-6 text-slate-500">{hint}</div>
        </div>
      </div>
    </section>
  );
}

function ShortcutTile({
  href,
  title,
  icon: Icon,
  tone = "slate",
}: {
  href: string;
  title: string;
  icon: any;
  tone?: "teal" | "amber" | "red" | "slate";
}) {
  const theme = toneStyles(tone);

  return (
    <Link
      href={href}
      className="rounded-[26px] border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:border-slate-300"
    >
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          background: theme.iconBg,
          color: theme.iconColor,
          border: theme.iconBorder,
        }}
      >
        <Icon size={28} />
      </div>

      <div className="mt-4 text-2xl font-extrabold text-slate-950">{title}</div>
    </Link>
  );
}

function VisitRow({
  href,
  title,
  subtitle,
  status,
}: {
  href: string;
  title: string;
  subtitle: string;
  status: string;
}) {
  const statusText =
    status === "closed" || status === "completed"
      ? "مغلقة"
      : status === "in_progress"
      ? "قيد التنفيذ"
      : "مجدولة";

  const statusClass =
    status === "closed" || status === "completed"
      ? "bg-slate-100 text-slate-700"
      : status === "in_progress"
      ? "bg-sky-50 text-sky-700"
      : "bg-slate-100 text-slate-600";

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300"
    >
      <div className="flex h-9 min-w-[72px] items-center justify-center rounded-full px-3 text-sm font-bold ${statusClass}" />
      <div className={`rounded-full px-3 py-2 text-sm font-bold ${statusClass}`}>
        {statusText}
      </div>

      <div className="flex-1 text-right">
        <div className="text-lg font-extrabold text-slate-950">{title}</div>
        <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard", "view");

  const [facilities, visits, visitSystems, assets, findings] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "VISIT_SYSTEMS"),
    readSheet(actor.workbookId, "ASSETS"),
    readSheet(actor.workbookId, "FINDINGS"),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(actor.workbookId, actor)
      : null;

  const visibleVisits =
    actor.role === "inspector"
      ? visits.filter((visit: any) =>
          isVisitAssignedToInspector(
            visit,
            String(currentInspector?.inspector_id || "")
          )
        )
      : visits;

  const latestVisits = sortByDateDesc(visibleVisits, "planned_date").slice(0, 5);

  const todaysVisits = visibleVisits.filter(
    (visit: any) =>
      String(visit.planned_date || visit.visit_date || "") === todayIso
  ).length;

  const overdueVisits = visibleVisits.filter((visit: any) => {
    const status = String(visit.visit_status || "").toLowerCase();
    const planned = String(visit.planned_date || "");
    if (!planned) return false;
    if (status === "closed" || status === "completed") return false;
    return planned < todayIso;
  }).length;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
        <PageHeader
          title="لوحة المفتش"
          subtitle="لم يتم ربط حسابك بسجل مفتش داخل INSPECTORS"
        />
        <EmptyState
          title="لا يوجد ملف مفتش لهذا الحساب"
          description="أضف app_user_id أو email الصحيح داخل شيت INSPECTORS لربط هذا الحساب بالمفتش."
          icon={UserRound}
        />
      </AppShell>
    );
  }

  const allowedSystems =
    actor.role === "inspector"
      ? parseAllowedSystems(currentInspector?.allowed_systems)
      : [];

  const visibleAssets =
    actor.role === "inspector"
      ? assets.filter((asset: any) => {
          const systemCode = String(asset.system_code || "");
          return (
            allowedSystems.includes("*") || allowedSystems.includes(systemCode)
          );
        })
      : assets;

  const visibleVisitIds = new Set(
    visibleVisits.map((visit: any) => String(visit.visit_id))
  );

  const visibleVisitSystemIds = new Set(
    visitSystems
      .filter((vs: any) => visibleVisitIds.has(String(vs.visit_id)))
      .map((vs: any) => String(vs.visit_system_id))
  );

  const visibleFindings =
    actor.role === "inspector"
      ? findings.filter((finding: any) =>
          visibleVisitSystemIds.has(String(finding.visit_system_id))
        )
      : findings;

  const openVisibleFindingsCount = visibleFindings.filter((finding: any) => {
    const status = String(
      finding.closure_status || finding.compliance_status || ""
    ).toLowerCase();
    return status !== "closed";
  }).length;

  const visibleFacilities =
    actor.role === "inspector"
      ? facilities.filter((facility: any) =>
          visibleAssets.some(
            (asset: any) =>
              String(asset.facility_id || "") === String(facility.facility_id || "")
          )
        )
      : facilities;

  const dueAssets = sortByDueDateAsc(
    visibleAssets
      .map((asset: any) => {
        const nextDueDate = String(asset.next_due_date || "");
        if (!nextDueDate) return null;

        const due = new Date(nextDueDate);
        if (Number.isNaN(due.getTime())) return null;

        due.setHours(0, 0, 0, 0);
        const daysDiff = daysBetween(today, due);

        if (daysDiff > 7) return null;

        return {
          asset_id: String(asset.asset_id || ""),
          asset_code: String(asset.asset_code || ""),
          asset_name: String(asset.asset_name || ""),
          asset_name_ar: String(asset.asset_name_ar || ""),
          system_code: String(asset.system_code || ""),
          next_due_date: nextDueDate,
          due_days_diff: daysDiff,
          due_label: getDueLabel(daysDiff),
        };
      })
      .filter(Boolean)
  );

  const unassignedOpenVisits =
    actor.role === "inspector"
      ? []
      : visits.filter((visit: any) => {
          const status = String(visit.visit_status || "").toLowerCase();
          const assigned = String(visit.assigned_inspector_id || "").trim();

          return (
            status !== "closed" &&
            status !== "completed" &&
            assigned.length === 0
          );
        });

  return (
    <AppShell>
      <section className="mb-4 rounded-[30px] border border-slate-200 bg-white px-5 py-6 shadow-sm">
        <div className="text-right">
          <div className="text-base text-slate-500">
            {actor.role === "inspector" ? "لوحة المفتش" : "إدارة العمليات المركزية"}
          </div>
          <div className="mt-2 text-5xl font-extrabold leading-tight text-slate-950">
            {actor.role === "inspector" ? "لوحة المفتش" : "لوحة التحكم"}
          </div>
          <div className="mt-4 text-lg leading-8 text-slate-500">
            {actor.role === "inspector"
              ? `مرحبًا ${
                  currentInspector?.full_name_ar ||
                  currentInspector?.full_name ||
                  actor.email ||
                  "Inspector"
                }`
              : "الوصول السريع لأهم وظائف التشغيل والإدارة"}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-700">
            تاريخ اليوم: {todayIso}
          </span>
          <span className="rounded-full border border-teal-100 bg-teal-50 px-4 py-3 text-base font-bold text-teal-700">
            حالة النظام: متصل
          </span>
        </div>
      </section>

      <div className="space-y-4">
        <section className="grid grid-cols-2 gap-4">
          {actor.role === "inspector" ? (
            <>
              <CompactStatCard
                label="زياراتي"
                value={visibleVisits.length}
                hint="كل الزيارات المعينة لك"
                icon={ClipboardList}
                tone="teal"
              />
              <CompactStatCard
                label="اليوم"
                value={todaysVisits}
                hint="زيارات اليوم"
                icon={Clock3}
                tone="slate"
              />
              <CompactStatCard
                label="متأخر"
                value={overdueVisits}
                hint="تحتاج تنفيذ"
                icon={AlertTriangle}
                tone={overdueVisits > 0 ? "amber" : "slate"}
              />
              <CompactStatCard
                label="المخالفات"
                value={openVisibleFindingsCount}
                hint="مفتوحة"
                icon={ShieldAlert}
                tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
              />
            </>
          ) : (
            <>
              <CompactStatCard
                label="المنشآت"
                value={visibleFacilities.length}
                hint="إجمالي المنشآت"
                icon={Building2}
                tone="teal"
              />
              <CompactStatCard
                label="الأصول"
                value={visibleAssets.length}
                hint="كل الأصول المسجلة"
                icon={Boxes}
                tone="slate"
              />
              <CompactStatCard
                label="غير مسندة"
                value={unassignedOpenVisits.length}
                hint="زيارات تحتاج توزيع"
                icon={Users}
                tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
              />
              <CompactStatCard
                label="المخالفات"
                value={openVisibleFindingsCount}
                hint="مفتوحة"
                icon={ShieldAlert}
                tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
              />
            </>
          )}
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-4xl font-extrabold text-slate-950">إجراءات سريعة</div>
            <div className="mt-2 text-lg text-slate-500">
              الوصول السريع لأهم الوظائف الإدارية
            </div>
          </div>

          {actor.role === "inspector" ? (
            <div className="grid grid-cols-2 gap-4">
              <ShortcutTile
                href="/visits"
                title="الزيارات"
                icon={ClipboardList}
                tone="teal"
              />
              <ShortcutTile
                href="/assets"
                title="الأصول"
                icon={Boxes}
                tone="slate"
              />
              <ShortcutTile
                href="/findings"
                title="المخالفات"
                icon={ShieldAlert}
                tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
              />
              <ShortcutTile
                href="/reports"
                title="التقارير"
                icon={Activity}
                tone="slate"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <ShortcutTile
                href="/unassigned-visits"
                title="توزيع المهام"
                icon={Users}
                tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
              />
              <ShortcutTile
                href="/facilities/new"
                title="إضافة منشأة"
                icon={Building2}
                tone="teal"
              />
              <ShortcutTile
                href="/assets/labels"
                title="طباعة ملصقات"
                icon={QrCode}
                tone="slate"
              />
              <ShortcutTile
                href="/settings"
                title="الإعدادات"
                icon={Settings}
                tone="slate"
              />
            </div>
          )}
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-4xl font-extrabold text-slate-950">
              سجل المهام والزيارات
            </div>
            <div className="mt-2 text-lg text-slate-500">
              متابعة سريعة لأحدث الحركة التشغيلية
            </div>
          </div>

          {latestVisits.length === 0 ? (
            <EmptyState
              title="لا توجد زيارات"
              description="ستظهر هنا أحدث الزيارات تلقائيًا."
              icon={ClipboardList}
            />
          ) : (
            <div className="space-y-3">
              {latestVisits.map((visit: any) => (
                <VisitRow
                  key={String(visit.visit_id)}
                  href={`/visits/${visit.visit_id}`}
                  title={String(visit.visit_type || "زيارة")}
                  subtitle={`التاريخ: ${String(
                    visit.planned_date || visit.visit_date || "-"
                  )}`}
                  status={String(visit.visit_status || "planned").toLowerCase()}
                />
              ))}
            </div>
          )}
        </section>

        {actor.role !== "inspector" && dueAssets.length > 0 ? (
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-right">
              <div className="text-4xl font-extrabold text-slate-950">
                استحقاقات الأصول
              </div>
              <div className="mt-2 text-lg text-slate-500">
                أهم العناصر التي تحتاج متابعة قريبة
              </div>
            </div>

            <div className="space-y-3">
              {dueAssets.slice(0, 4).map((asset: any) => (
                <Link
                  key={String(asset.asset_id)}
                  href={`/assets/${String(asset.asset_id)}`}
                  className="block rounded-[22px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-slate-950">
                      {String(
                        asset.asset_name_ar ||
                          asset.asset_name ||
                          asset.asset_code ||
                          asset.asset_id
                      )}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {String(asset.system_code || "-")} · الاستحقاق:{" "}
                      {String(asset.next_due_date || "-")} ·{" "}
                      {String(asset.due_label)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
