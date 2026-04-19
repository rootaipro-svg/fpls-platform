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
  ChevronLeft,
  Activity,
  FileWarning,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
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

function toArabicVisitStatus(value: string) {
  const v = String(value || "").toLowerCase();
  if (v === "planned") return "مجدولة";
  if (v === "open") return "مفتوحة";
  if (v === "in_progress") return "قيد التنفيذ";
  if (v === "closed") return "مغلقة";
  if (v === "completed") return "مغلقة";
  return value || "-";
}

function formatDate(value: any) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return raw;
  return dt.toISOString().slice(0, 10);
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "14px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: "6px",
              fontSize: "15px",
              color: "#64748b",
              lineHeight: 1.8,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}

function StatusChip({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "teal" | "amber" | "red" | "slate";
}) {
  const palette = {
    teal: { bg: "#ecfeff", text: "#0f766e", border: "#ccfbf1" },
    amber: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    red: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    slate: { bg: "#f8fafc", text: "#334155", border: "#e2e8f0" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 14px",
        borderRadius: "999px",
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.text,
        fontSize: "14px",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function TopOpsCard({
  title,
  subtitle,
  todayLabel,
  secondaryLabel,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  todayLabel: string;
  secondaryLabel: string;
  icon: LucideIcon;
}) {
  return (
    <section
      className="card"
      style={{
        padding: "18px",
        borderRadius: "26px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "22px",
            background: "#ecfeff",
            color: "#0f766e",
            border: "1px solid #ccfbf1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={30} />
        </div>

        <div style={{ flex: 1, textAlign: "right" }}>
          <div
            style={{
              fontSize: "15px",
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "34px",
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          borderTop: "1px solid #e2e8f0",
          paddingTop: "14px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "flex-start",
        }}
      >
        <StatusChip label={todayLabel} tone="slate" />
        <StatusChip label={secondaryLabel} tone="teal" />
      </div>
    </section>
  );
}

function QuickActionTile({
  href,
  title,
  icon: Icon,
  tone = "slate",
}: {
  href: string;
  title: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "red" | "slate";
}) {
  const palette = {
    teal: { bg: "#ecfeff", text: "#0f766e", border: "#ccfbf1" },
    amber: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    red: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    slate: { bg: "#f8fafc", text: "#334155", border: "#e2e8f0" },
  }[tone];

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        minHeight: "108px",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: "14px",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "16px",
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={21} />
      </div>

      <div
        style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "#0f172a",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {title}
      </div>
    </Link>
  );
}

function AlertStrip({
  title,
  text,
  href,
  buttonLabel,
}: {
  title: string;
  text: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <section
      className="card"
      style={{
        border: "1px solid #fecaca",
        background: "#fff7f7",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: "58px",
            height: "58px",
            borderRadius: "999px",
            background: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <div style={{ flex: 1, minWidth: "220px" }}>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              color: "#991b1b",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "16px",
              color: "#b91c1c",
              lineHeight: 1.8,
            }}
          >
            {text}
          </div>
        </div>

        <Link
          href={href}
          className="btn"
          style={{
            background: "#dc2626",
            borderColor: "#dc2626",
            color: "#fff",
          }}
        >
          {buttonLabel}
        </Link>
      </div>
    </section>
  );
}

function TinyMetricCard({
  value,
  label,
  icon: Icon,
  tone = "slate",
}: {
  value: number | string;
  label: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "red" | "slate";
}) {
  const palette = {
    teal: { bg: "#ecfeff", text: "#0f766e", border: "#ccfbf1" },
    amber: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    red: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    slate: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
  }[tone];

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        background: "#fff",
        padding: "16px",
        minHeight: "110px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "18px",
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={24} />
      </div>

      <div style={{ textAlign: "right", flex: 1 }}>
        <div
          style={{
            fontSize: "16px",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: "2px",
            fontSize: "40px",
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function DataTabs({
  visitsCount,
  findingsCount,
}: {
  visitsCount: number;
  findingsCount: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        marginBottom: "14px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          padding: "10px 18px",
          borderRadius: "14px",
          border: "1px solid #dbe2ea",
          background: "#fff",
          color: "#0f172a",
          fontWeight: 800,
          fontSize: "16px",
        }}
      >
        الزيارات ({visitsCount})
      </div>

      <div
        style={{
          padding: "10px 18px",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          color: "#64748b",
          fontWeight: 800,
          fontSize: "16px",
        }}
      >
        المخالفات ({findingsCount})
      </div>
    </div>
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
  const statusLower = String(status || "").toLowerCase();
  const tone =
    statusLower === "closed" || statusLower === "completed"
      ? "slate"
      : statusLower === "in_progress" || statusLower === "open"
      ? "teal"
      : "amber";

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 0",
        textDecoration: "none",
        borderTop: "1px solid #eef2f7",
      }}
    >
      <ChevronLeft size={18} color="#94a3b8" />

      <div style={{ flex: 1, textAlign: "right" }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: "4px",
            fontSize: "15px",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          {subtitle}
        </div>
      </div>

      <StatusChip label={toArabicVisitStatus(status)} tone={tone as any} />
    </Link>
  );
}

function DueAssetRow({
  href,
  title,
  systemCode,
  dueDate,
  dueLabel,
}: {
  href: string;
  title: string;
  systemCode: string;
  dueDate: string;
  dueLabel: string;
}) {
  const tone =
    dueLabel === "متأخر" ? "red" : dueLabel === "قريب" ? "amber" : "slate";

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 0",
        textDecoration: "none",
        borderTop: "1px solid #eef2f7",
      }}
    >
      <StatusChip label={dueLabel} tone={tone as any} />

      <div style={{ flex: 1, textAlign: "right" }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: "4px",
            fontSize: "15px",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          {systemCode} · الاستحقاق: {dueDate}
        </div>
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

  const completedVisits = visibleVisits.filter((visit: any) => {
    const status = String(visit.visit_status || "").toLowerCase();
    return status === "closed" || status === "completed";
  }).length;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
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

  const overdueDueAssetsCount = dueAssets.filter(
    (asset: any) => Number(asset.due_days_diff) < 0
  ).length;

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

  if (actor.role === "inspector") {
    const inspectorName =
      currentInspector?.full_name_ar ||
      currentInspector?.full_name ||
      actor.email ||
      "مفتش";

    return (
      <AppShell>
        <TopOpsCard
          title="لوحة المفتش"
          subtitle={String(inspectorName)}
          todayLabel={`تاريخ اليوم: ${todayIso}`}
          secondaryLabel={
            overdueVisits > 0
              ? `يوجد ${overdueVisits} زيارة متأخرة`
              : "حالة النظام: متصل"
          }
          icon={Activity}
        />

        {(overdueVisits > 0 || openVisibleFindingsCount > 0 || dueAssets.length > 0) && (
          <AlertStrip
            title="تنبيه ميداني"
            text={
              overdueVisits > 0
                ? `لديك ${overdueVisits} زيارة متأخرة تحتاج بدء التنفيذ.`
                : openVisibleFindingsCount > 0
                ? `لديك ${openVisibleFindingsCount} مخالفة مفتوحة تحتاج متابعة.`
                : `لديك ${dueAssets.length} أصلًا مستحقًا يحتاج مراجعة قريبًا.`
            }
            href={overdueVisits > 0 ? "/visits" : openVisibleFindingsCount > 0 ? "/findings" : "/assets"}
            buttonLabel="فتح الآن"
          />
        )}

        <section className="card" style={{ marginBottom: "18px" }}>
          <SectionHeader title="إجراءات سريعة" subtitle="أهم ما يحتاجه المفتش للعمل اليومي" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <QuickActionTile
              href="/visits"
              title="زياراتي"
              icon={ClipboardList}
              tone="teal"
            />
            <QuickActionTile
              href="/assets"
              title="الأصول"
              icon={Boxes}
              tone="slate"
            />
            <QuickActionTile
              href="/findings"
              title="المخالفات"
              icon={ShieldAlert}
              tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
            />
            <QuickActionTile
              href="/assets/labels"
              title="ملصقات QR"
              icon={QrCode}
              tone="slate"
            />
          </div>
        </section>

        <section className="card" style={{ marginBottom: "18px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <TinyMetricCard
              value={visibleVisits.length}
              label="الزيارات"
              icon={ClipboardList}
              tone="teal"
            />
            <TinyMetricCard
              value={todaysVisits}
              label="زيارات اليوم"
              icon={Clock3}
              tone="slate"
            />
            <TinyMetricCard
              value={dueAssets.length}
              label="أصول مستحقة"
              icon={Boxes}
              tone={dueAssets.length > 0 ? "amber" : "slate"}
            />
            <TinyMetricCard
              value={openVisibleFindingsCount}
              label="مخالفات مفتوحة"
              icon={FileWarning}
              tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
            />
          </div>
        </section>

        <section className="card" style={{ marginBottom: "18px" }}>
          <SectionHeader title="سجل المهام والزيارات" subtitle="أحدث ما تم إسناده لك" />

          <DataTabs
            visitsCount={visibleVisits.length}
            findingsCount={openVisibleFindingsCount}
          />

          {latestVisits.length === 0 ? (
            <EmptyState
              title="لا توجد زيارات مخصصة لك"
              description="عند تعيين زيارات لك ستظهر هنا مباشرة."
              icon={ClipboardList}
            />
          ) : (
            <div>
              {latestVisits.map((visit: any, index: number) => (
                <div key={String(visit.visit_id)}>
                  {index === 0 ? null : null}
                  <VisitRow
                    href={`/visits/${visit.visit_id}`}
                    title={String(visit.visit_type || "زيارة")}
                    subtitle={`${String(
                      visit.facility_name ||
                        visit.building_name ||
                        visit.notes ||
                        "بدون وصف"
                    )} · التاريخ: ${formatDate(
                      visit.planned_date || visit.visit_date || "-"
                    )}`}
                    status={String(visit.visit_status || "planned")}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <SectionHeader
            title="استحقاقات الأصول"
            subtitle="الأصول التي تحتاج متابعة ميدانية الآن"
            action={<Link href="/assets">عرض الكل</Link>}
          />

          {dueAssets.length === 0 ? (
            <EmptyState
              title="لا توجد أصول مستحقة حاليًا"
              description="كل الأصول ضمن المدى الحالي أو لم يتم ضبط جدولها بعد."
              icon={Clock3}
            />
          ) : (
            <div>
              {dueAssets.slice(0, 4).map((asset: any) => (
                <DueAssetRow
                  key={String(asset.asset_id)}
                  href={`/assets/${String(asset.asset_id)}`}
                  title={String(
                    asset.asset_name_ar ||
                      asset.asset_name ||
                      asset.asset_code ||
                      asset.asset_id
                  )}
                  systemCode={String(asset.system_code || "-")}
                  dueDate={formatDate(asset.next_due_date)}
                  dueLabel={String(asset.due_label)}
                />
              ))}
            </div>
          )}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopOpsCard
        title="لوحة التحكم"
        subtitle="إدارة العمليات المركزية"
        todayLabel={`تاريخ اليوم: ${todayIso}`}
        secondaryLabel="حالة النظام: متصل"
        icon={Activity}
      />

      <section className="card" style={{ marginBottom: "18px" }}>
        <SectionHeader title="إجراءات سريعة" subtitle="الوصول السريع لأهم الوظائف الإدارية" />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <QuickActionTile
            href="/facilities"
            title="إضافة منشأة"
            icon={Building2}
            tone="teal"
          />
          <QuickActionTile
            href="/unassigned-visits"
            title="توزيع المهام"
            icon={Users}
            tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
          />
          <QuickActionTile
            href="/settings"
            title="الإعدادات"
            icon={Settings}
            tone="slate"
          />
          <QuickActionTile
            href="/assets/labels"
            title="طباعة ملصقات"
            icon={QrCode}
            tone="slate"
          />
        </div>
      </section>

      {unassignedOpenVisits.length > 0 ? (
        <AlertStrip
          title="تنبيه تشغيلي: زيارات غير مسندة"
          text={`يوجد ${unassignedOpenVisits.length} زيارات تتطلب تعيين مفتش فورًا.`}
          href="/unassigned-visits"
          buttonLabel="تعيين الآن"
        />
      ) : null}

      <section className="card" style={{ marginBottom: "18px" }}>
        <SectionHeader title="سجل المهام والزيارات" subtitle="متابعة سريعة لأحدث الحركة التشغيلية" />

        <DataTabs
          visitsCount={visibleVisits.length}
          findingsCount={openVisibleFindingsCount}
        />

        {latestVisits.length === 0 ? (
          <EmptyState
            title="لا توجد زيارات حتى الآن"
            description="بعد إنشاء زيارة جديدة ستظهر هنا آخر الزيارات المنفذة أو المجدولة."
            icon={ClipboardList}
          />
        ) : (
          <div>
            {latestVisits.map((visit: any) => (
              <VisitRow
                key={String(visit.visit_id)}
                href={`/visits/${visit.visit_id}`}
                title={String(visit.visit_type || "زيارة")}
                subtitle={`${String(
                  visit.building_name ||
                    visit.facility_name ||
                    visit.notes ||
                    "بدون وصف"
                )} · التاريخ: ${formatDate(
                  visit.planned_date || visit.visit_date || "-"
                )}`}
                status={String(visit.visit_status || "planned")}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card" style={{ marginBottom: "18px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <TinyMetricCard
            value={visibleAssets.length}
            label="الأصول"
            icon={Boxes}
            tone="slate"
          />
          <TinyMetricCard
            value={visibleFacilities.length}
            label="المنشآت"
            icon={Building2}
            tone="teal"
          />
          <TinyMetricCard
            value={openVisibleFindingsCount}
            label="مخالفات"
            icon={ShieldAlert}
            tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
          />
          <TinyMetricCard
            value={unassignedOpenVisits.length}
            label="مهام معلقة"
            icon={Users}
            tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
          />
        </div>
      </section>

      <section className="card">
        <SectionHeader
          title="استحقاقات الأصول"
          subtitle="الأصول التي تحتاج متابعة قريبة أو فورية"
          action={<Link href="/assets">عرض الكل</Link>}
        />

        {dueAssets.length === 0 ? (
          <EmptyState
            title="لا توجد أصول مستحقة حاليًا"
            description="كل الأصول ضمن المدى الحالي أو لم يتم ضبط جدولها بعد."
            icon={Clock3}
          />
        ) : (
          <div>
            {dueAssets.slice(0, 5).map((asset: any) => (
              <DueAssetRow
                key={String(asset.asset_id)}
                href={`/assets/${String(asset.asset_id)}`}
                title={String(
                  asset.asset_name_ar ||
                    asset.asset_name ||
                    asset.asset_code ||
                    asset.asset_id
                )}
                systemCode={String(asset.system_code || "-")}
                dueDate={formatDate(asset.next_due_date)}
                dueLabel={String(asset.due_label)}
              />
            ))}
          </div>
        )}
      </section>

      {overdueDueAssetsCount > 0 ? (
        <div style={{ marginTop: "12px" }}>
          <StatusChip label={`الأصول المتأخرة: ${overdueDueAssetsCount}`} tone="red" />
        </div>
      ) : null}
    </AppShell>
  );
}
