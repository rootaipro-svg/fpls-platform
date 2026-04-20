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
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
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

function toVisitTypeLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    followup: "متابعة (Follow-up)",
    asset_followup: "متابعة أصل (Asset Follow-up)",
    handover: "تسليم واستلام (Handover)",
    safety_inspection: "فحص سلامة (Safety Inspection)",
    periodic_inspection: "تفتيش دوري (Periodic Inspection)",
    initial_survey: "معاينة أولية (Initial Survey)",
    emergency_maintenance: "صيانة طارئة (Emergency Maintenance)",
    quality_audit: "تدقيق جودة (Quality Audit)",
    inspection: "تفتيش (Inspection)",
    audit: "تدقيق (Audit)",
  };

  return map[v] || String(value || "زيارة");
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
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontSize: "22px",
          lineHeight: 1.2,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {title}
      </div>
      {subtitle ? (
        <div
          style={{
            marginTop: "6px",
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({
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
    <div
      className="card"
      style={{
        minHeight: "156px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "16px",
              color: "#475569",
              fontWeight: 700,
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: "10px",
              fontSize: "56px",
              lineHeight: 1,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: "58px",
            height: "58px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.iconBg,
            color: theme.iconColor,
            border: theme.iconBorder,
            flexShrink: 0,
          }}
        >
          <Icon size={28} />
        </div>
      </div>

      <div
        style={{
          marginTop: "14px",
          fontSize: "14px",
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        {hint}
      </div>
    </div>
  );
}

function ActionTile({
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
      className="card"
      style={{
        minHeight: "182px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.iconBg,
          color: theme.iconColor,
          border: theme.iconBorder,
        }}
      >
        <Icon size={34} />
      </div>

      <div
        style={{
          marginTop: "18px",
          fontSize: "20px",
          lineHeight: 1.45,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {title}
      </div>
    </Link>
  );
}

function ActivityRow({
  href,
  title,
  subline,
  status,
}: {
  href: string;
  title: string;
  subline: string;
  status: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 18px",
        borderRadius: "22px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        textDecoration: "none",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.45,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          {subline}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <StatusBadge status={status} />
      </div>
    </Link>
  );
}

function DueRow({
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
    dueLabel === "متأخر"
      ? "#b91c1c"
      : dueLabel === "اليوم"
      ? "#b45309"
      : "#0f766e";

  const bg =
    dueLabel === "متأخر"
      ? "#fef2f2"
      : dueLabel === "اليوم"
      ? "#fffbeb"
      : "#ecfeff";

  const border =
    dueLabel === "متأخر"
      ? "1px solid #fecaca"
      : dueLabel === "اليوم"
      ? "1px solid #fde68a"
      : "1px solid #ccfbf1";

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 18px",
        borderRadius: "22px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        textDecoration: "none",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.45,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: "6px",
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          {systemCode} · الاستحقاق: {dueDate}
        </div>
      </div>

      <div
        style={{
          padding: "10px 14px",
          borderRadius: "999px",
          background: bg,
          color: tone,
          border,
          fontSize: "14px",
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {dueLabel}
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

  const latestByBuildingSystem = new Map<string, any>();

  for (const row of visitSystems) {
    const key = String(row.building_system_id || "");
    if (!key) continue;

    const current = latestByBuildingSystem.get(key);
    const rowStamp = String(
      row.updated_at || row.actual_end_time || row.next_due_date || ""
    );
    const currentStamp = String(
      current?.updated_at || current?.actual_end_time || current?.next_due_date || ""
    );

    if (!current || rowStamp > currentStamp) {
      latestByBuildingSystem.set(key, row);
    }
  }

  const dueItems =
    actor.role === "inspector"
      ? []
      : Array.from(latestByBuildingSystem.values()).filter((row) => {
          if (!String(row.next_due_date || "").trim()) return false;

          const due = new Date(String(row.next_due_date));
          due.setHours(0, 0, 0, 0);

          return daysBetween(today, due) <= 7;
        });

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

  const facilityNameMap = new Map(
    visibleFacilities.map((f: any) => [
      String(f.facility_id || ""),
      String(f.facility_name || f.facility_name_ar || "منشأة غير محددة"),
    ])
  );

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
    return (
      <AppShell>
        <section className="card">
          <SectionHeader
            title="لوحة المفتش"
            subtitle={`مرحبًا ${
              currentInspector?.full_name_ar ||
              currentInspector?.full_name ||
              actor.email ||
              "Inspector"
            } · الوصول السريع لأهم ما يخص التنفيذ الميداني`}
          />

          <div className="badge-wrap" style={{ marginTop: "12px" }}>
            <span className="badge">تاريخ اليوم: {todayIso}</span>
            <span className="badge">الحالة: متصل</span>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "14px",
            marginTop: "14px",
          }}
        >
          <KpiCard
            label="زياراتي"
            value={visibleVisits.length}
            hint="كل الزيارات المسندة لك"
            icon={ClipboardList}
            tone="teal"
          />
          <KpiCard
            label="اليوم"
            value={todaysVisits}
            hint="المجدولة لليوم"
            icon={Clock3}
            tone="slate"
          />
          <KpiCard
            label="متأخرة"
            value={overdueVisits}
            hint="تحتاج تنفيذًا عاجلًا"
            icon={AlertTriangle}
            tone={overdueVisits > 0 ? "amber" : "slate"}
          />
          <KpiCard
            label="المخالفات"
            value={openVisibleFindingsCount}
            hint="مفتوحة وتحتاج متابعة"
            icon={ShieldAlert}
            tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
          />
        </div>

        <section className="card" style={{ marginTop: "14px" }}>
          <SectionHeader
            title="إجراءات سريعة"
            subtitle="كل صف يحتوي خيارين واضحين للمفتش"
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <ActionTile
              href="/visits"
              title="زياراتي"
              icon={ClipboardList}
              tone="teal"
            />
            <ActionTile
              href="/assets"
              title="لوحة الأصول"
              icon={Boxes}
              tone="slate"
            />
            <ActionTile
              href="/findings"
              title="المخالفات"
              icon={ShieldAlert}
              tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
            />
            <ActionTile
              href="/reports"
              title="التقارير"
              icon={QrCode}
              tone="slate"
            />
          </div>
        </section>

        <section className="card" style={{ marginTop: "14px" }}>
          <SectionHeader
            title="الأصول المستحقة الآن"
            subtitle="الأصول التي تحتاج اهتمامًا قريبًا أو فوريًا"
          />

          {dueAssets.length === 0 ? (
            <EmptyState
              title="لا توجد أصول مستحقة حاليًا"
              description="كل الأصول ضمن المدى الزمني الحالي أو لم يتم ضبط جدولها بعد."
              icon={Clock3}
            />
          ) : (
            <div className="stack-3" style={{ marginTop: "10px" }}>
              {dueAssets.slice(0, 5).map((asset: any) => (
                <DueRow
                  key={String(asset.asset_id)}
                  href={`/assets/${String(asset.asset_id)}`}
                  title={String(
                    asset.asset_name_ar ||
                      asset.asset_name ||
                      asset.asset_code ||
                      asset.asset_id
                  )}
                  systemCode={String(asset.system_code || "-")}
                  dueDate={String(asset.next_due_date || "-")}
                  dueLabel={String(asset.due_label || "-")}
                />
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ marginTop: "14px" }}>
          <SectionHeader
            title="سجل المهام والزيارات"
            subtitle="متابعة سريعة لأحدث الحركة التشغيلية"
          />

          {latestVisits.length === 0 ? (
            <EmptyState
              title="لا توجد زيارات مخصصة لك"
              description="عند تعيين زيارات لك ستظهر هنا مباشرة."
              icon={ClipboardList}
            />
          ) : (
            <div className="stack-3" style={{ marginTop: "10px" }}>
              {latestVisits.map((visit: any) => (
                <ActivityRow
                  key={String(visit.visit_id)}
                  href={`/visits/${String(visit.visit_id)}`}
                  title={toVisitTypeLabel(visit.visit_type)}
                  subline={`التاريخ: ${String(
                    visit.planned_date || visit.visit_date || "-"
                  )}`}
                  status={String(visit.visit_status || "planned")}
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
      <section className="card">
        <SectionHeader
          title="لوحة التحكم"
          subtitle="إدارة العمليات المركزية والوصول السريع لأهم وظائف التشغيل والإدارة"
        />

        <div className="badge-wrap" style={{ marginTop: "12px" }}>
          <span className="badge">تاريخ اليوم: {todayIso}</span>
          <span className="badge">حالة النظام: متصل</span>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "14px",
          marginTop: "14px",
        }}
      >
        <KpiCard
          label="المنشآت"
          value={visibleFacilities.length}
          hint="إجمالي المنشآت المسجلة"
          icon={Building2}
          tone="teal"
        />
        <KpiCard
          label="الأصول"
          value={visibleAssets.length}
          hint="كل الأصول المسجلة"
          icon={Boxes}
          tone="slate"
        />
        <KpiCard
          label="المخالفات"
          value={openVisibleFindingsCount}
          hint="مفتوحة وتحتاج متابعة"
          icon={ShieldAlert}
          tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
        />
        <KpiCard
          label="غير مسندة"
          value={unassignedOpenVisits.length}
          hint="زيارات تحتاج توزيع"
          icon={Users}
          tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
        />
      </div>

      <section className="card" style={{ marginTop: "14px" }}>
        <SectionHeader
          title="إجراءات سريعة"
          subtitle="كل صف يحتوي خيارين واضحين ويستغل المساحة أفضل"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "14px",
          }}
        >
          <ActionTile
            href="/facilities"
            title="إضافة منشأة"
            icon={Building2}
            tone="teal"
          />
          <ActionTile
            href="/unassigned-visits"
            title="توزيع المهام"
            icon={Users}
            tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
          />
          <ActionTile
            href="/assets/labels"
            title="طباعة ملصقات"
            icon={QrCode}
            tone="slate"
          />
          <ActionTile
            href="/settings"
            title="الإعدادات"
            icon={Settings}
            tone="slate"
          />
        </div>
      </section>

      {unassignedOpenVisits.length > 0 ? (
        <section
          className="card"
          style={{
            marginTop: "14px",
            border: "1px solid #fecaca",
            background: "#fff7f7",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#991b1b",
                  lineHeight: 1.25,
                }}
              >
                تنبيه تشغيلي: زيارات غير مسندة
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "15px",
                  color: "#b91c1c",
                  lineHeight: 1.8,
                }}
              >
                يوجد {unassignedOpenVisits.length} زيارة تحتاج تعيين مفتش فورًا.
              </div>
            </div>

            <Link href="/unassigned-visits" className="btn btn-secondary">
              تعيين الآن
            </Link>
          </div>
        </section>
      ) : null}

      <section className="card" style={{ marginTop: "14px" }}>
        <SectionHeader
          title="سجل المهام والزيارات"
          subtitle="متابعة سريعة لأحدث الحركة التشغيلية"
        />

        {latestVisits.length === 0 ? (
          <EmptyState
            title="لا توجد زيارات حتى الآن"
            description="بعد إنشاء زيارة جديدة ستظهر هنا آخر الزيارات المنفذة أو المجدولة."
            icon={ClipboardList}
          />
        ) : (
          <div className="stack-3" style={{ marginTop: "10px" }}>
            {latestVisits.map((visit: any) => {
              const facilityName =
                facilityNameMap.get(String(visit.facility_id || "")) ||
                "منشأة غير محددة";

              return (
                <ActivityRow
                  key={String(visit.visit_id)}
                  href={`/visits/${String(visit.visit_id)}`}
                  title={toVisitTypeLabel(visit.visit_type)}
                  subline={`${facilityName} · التاريخ: ${String(
                    visit.planned_date || visit.visit_date || "-"
                  )}`}
                  status={String(visit.visit_status || "planned")}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: "14px" }}>
        <SectionHeader
          title="استحقاقات الأصول"
          subtitle="الأصول المتأخرة واليوم والقريبة"
        />

        {dueAssets.length === 0 ? (
          <EmptyState
            title="لا توجد أصول مستحقة حاليًا"
            description="كل الأصول ضمن المدى الزمني الحالي أو لم يتم ضبط جدولها بعد."
            icon={Clock3}
          />
        ) : (
          <>
            <div className="badge-wrap" style={{ marginTop: "10px", marginBottom: "12px" }}>
              <span className="badge">المستحقة الآن: {dueAssets.length}</span>
              <span className="badge">المتأخرة: {overdueDueAssetsCount}</span>
              <span className="badge">أنظمة قريبة: {dueItems.length}</span>
            </div>

            <div className="stack-3">
              {dueAssets.slice(0, 5).map((asset: any) => (
                <DueRow
                  key={String(asset.asset_id)}
                  href={`/assets/${String(asset.asset_id)}`}
                  title={String(
                    asset.asset_name_ar ||
                      asset.asset_name ||
                      asset.asset_code ||
                      asset.asset_id
                  )}
                  systemCode={String(asset.system_code || "-")}
                  dueDate={String(asset.next_due_date || "-")}
                  dueLabel={String(asset.due_label || "-")}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
