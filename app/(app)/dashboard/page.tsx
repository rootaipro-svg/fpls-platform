import Link from "next/link";
import {
  Activity,
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
import {
  ActionCard,
  EmptyPanel,
  ListRow,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";
import { isClosedVisitStatus, isOpenFindingStatus, toVisitTypeLabel } from "@/lib/display";

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

function getDueTone(label: string) {
  if (label === "متأخر") return "red" as const;
  if (label === "اليوم") return "amber" as const;
  if (label === "قريب") return "teal" as const;
  return "slate" as const;
}

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard", "view");

  const [facilities, visits, visitSystems, assets, findings, buildings] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "VISIT_SYSTEMS"),
    readSheet(actor.workbookId, "ASSETS"),
    readSheet(actor.workbookId, "FINDINGS"),
    readSheet(actor.workbookId, "BUILDINGS"),
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

  const allowedSystems =
    actor.role === "inspector"
      ? parseAllowedSystems(currentInspector?.allowed_systems)
      : [];

  const visibleAssets =
    actor.role === "inspector"
      ? assets.filter((asset: any) => {
          const systemCode = String(asset.system_code || "");
          return allowedSystems.includes("*") || allowedSystems.includes(systemCode);
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
          asset_name: String(asset.asset_name_ar || asset.asset_name || asset.asset_code || "أصل"),
          system_code: String(asset.system_code || "-"),
          next_due_date: nextDueDate,
          due_label: getDueLabel(daysDiff),
        };
      })
      .filter(Boolean)
  );

  const openVisibleFindingsCount = visibleFindings.filter((finding: any) =>
    isOpenFindingStatus(finding.closure_status || finding.compliance_status || "")
  ).length;

  const latestVisits = sortByDateDesc(visibleVisits, "planned_date").slice(0, 5);

  const unassignedOpenVisits =
    actor.role === "inspector"
      ? []
      : visits.filter((visit: any) => {
          const assigned = String(visit.assigned_inspector_id || "").trim();
          return !isClosedVisitStatus(visit.visit_status) && assigned.length === 0;
        });

  const todaysVisits = visibleVisits.filter(
    (visit: any) =>
      String(visit.planned_date || visit.visit_date || "") === todayIso
  ).length;

  const overdueVisits = visibleVisits.filter((visit: any) => {
    const planned = String(visit.planned_date || "");
    if (!planned) return false;
    if (isClosedVisitStatus(visit.visit_status)) return false;
    return planned < todayIso;
  }).length;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
        <SectionCard
          title="ربط حساب المفتش"
          subtitle="لم يتم ربط هذا الحساب بسجل مفتش داخل INSPECTORS"
        >
          <EmptyPanel
            title="لا يوجد ملف مفتش لهذا الحساب"
            description="أضف app_user_id أو email الصحيح داخل شيت INSPECTORS لربط هذا الحساب بالمفتش."
          />
        </SectionCard>
      </AppShell>
    );
  }

  if (actor.role === "inspector") {
    return (
      <AppShell>
        <PageHero
          eyebrow="واجهة المفتش الميداني"
          title="لوحة المفتش"
          subtitle={`مرحبًا ${String(
            currentInspector?.full_name_ar ||
              currentInspector?.full_name ||
              actor.email ||
              "Inspector"
          )}`}
          icon={UserRound}
          pills={[`تاريخ اليوم: ${todayIso}`, "حالة النظام: متصل"]}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
            marginTop: "14px",
          }}
        >
          <MetricCard
            label="زياراتي"
            value={visibleVisits.length}
            hint="كل الزيارات المعينة لك"
            icon={ClipboardList}
            tone="teal"
          />
          <MetricCard
            label="اليوم"
            value={todaysVisits}
            hint="الزيارات المخططة اليوم"
            icon={Clock3}
            tone="slate"
          />
          <MetricCard
            label="متأخرة"
            value={overdueVisits}
            hint="زيارات تحتاج تنفيذ"
            icon={AlertTriangle}
            tone={overdueVisits > 0 ? "amber" : "slate"}
          />
          <MetricCard
            label="المخالفات"
            value={openVisibleFindingsCount}
            hint="مفتوحة وتحتاج متابعة"
            icon={ShieldAlert}
            tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
          />
        </div>

        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="إجراءات سريعة"
            subtitle="الوصول إلى أهم وظائف التنفيذ الميداني"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <ActionCard href="/visits" title="الزيارات" icon={ClipboardList} tone="teal" />
              <ActionCard href="/assets" title="الأصول" icon={Boxes} tone="slate" />
              <ActionCard href="/findings" title="المخالفات" icon={ShieldAlert} tone="red" />
              <ActionCard href="/reports" title="التقارير" icon={ClipboardList} tone="slate" />
            </div>
          </SectionCard>
        </div>

        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="آخر الزيارات"
            subtitle="متابعة سريعة لأحدث الحركة التشغيلية"
          >
            {latestVisits.length === 0 ? (
              <EmptyPanel
                title="لا توجد زيارات مخصصة لك"
                description="عند تعيين زيارات لك ستظهر هنا مباشرة."
              />
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {latestVisits.map((visit: any) => {
                  const facility = facilities.find(
                    (f: any) =>
                      String(f.facility_id || "") === String(visit.facility_id || "")
                  );
                  const building = buildings.find(
                    (b: any) =>
                      String(b.building_id || "") === String(visit.building_id || "")
                  );

                  return (
                    <ListRow
                      key={String(visit.visit_id)}
                      href={`/visits/${String(visit.visit_id)}`}
                      title={toVisitTypeLabel(visit.visit_type)}
                      subtitle={`${String(
                        facility?.facility_name || "منشأة غير محددة"
                      )}${building ? ` · ${String(building.building_name || "")}` : ""} · التاريخ: ${String(
                        visit.planned_date || visit.visit_date || "-"
                      )}`}
                    />
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        eyebrow="إدارة العمليات المركزية"
        title="لوحة التحكم"
        subtitle="الوصول السريع لأهم وظائف التشغيل والإدارة"
        icon={Activity}
        pills={[`تاريخ اليوم: ${todayIso}`, "حالة النظام: متصل"]}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginTop: "14px",
        }}
      >
        <MetricCard
          label="المنشآت"
          value={visibleFacilities.length}
          hint="إجمالي المنشآت المسجلة"
          icon={Building2}
          tone="teal"
        />
        <MetricCard
          label="الأصول"
          value={visibleAssets.length}
          hint="كل الأصول المسجلة"
          icon={Boxes}
          tone="slate"
        />
        <MetricCard
          label="المخالفات"
          value={openVisibleFindingsCount}
          hint="مفتوحة وتحتاج متابعة"
          icon={ShieldAlert}
          tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
        />
        <MetricCard
          label="غير مسندة"
          value={unassignedOpenVisits.length}
          hint="زيارات تحتاج توزيع"
          icon={Users}
          tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="إجراءات سريعة"
          subtitle="الوصول السريع لأهم الوظائف الإدارية"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <ActionCard href="/facilities/new" title="إضافة منشأة" icon={Building2} tone="teal" />
            <ActionCard href="/unassigned-visits" title="توزيع المهام" icon={Users} tone="amber" />
            <ActionCard href="/assets/labels" title="طباعة ملصقات" icon={QrCode} tone="slate" />
            <ActionCard href="/settings" title="الإعدادات" icon={Settings} tone="slate" />
          </div>
        </SectionCard>
      </div>

      {unassignedOpenVisits.length > 0 ? (
        <div style={{ marginTop: "14px" }}>
          <section
            className="card"
            style={{
              padding: "18px",
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
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 900,
                    color: "#991b1b",
                  }}
                >
                  تنبيه تشغيلي
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "14px",
                    lineHeight: 1.7,
                    color: "#7f1d1d",
                  }}
                >
                  يوجد {unassignedOpenVisits.length} زيارة غير مسندة وتحتاج تعيين مفتش فورًا.
                </div>
              </div>

              <Link
                href="/unassigned-visits"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "112px",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  background: "#dc2626",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                تعيين الآن
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="سجل المهام والزيارات"
          subtitle="متابعة سريعة لأحدث الحركة التشغيلية"
        >
          {latestVisits.length === 0 ? (
            <EmptyPanel
              title="لا توجد حركة حديثة"
              description="بعد إنشاء زيارات جديدة ستظهر هنا أحدث العمليات."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {latestVisits.map((visit: any) => {
                const facility = facilities.find(
                  (f: any) =>
                    String(f.facility_id || "") === String(visit.facility_id || "")
                );
                const building = buildings.find(
                  (b: any) =>
                    String(b.building_id || "") === String(visit.building_id || "")
                );

                const badgeTone = isClosedVisitStatus(visit.visit_status)
                  ? "teal"
                  : "slate";

                return (
                  <ListRow
                    key={String(visit.visit_id)}
                    href={`/visits/${String(visit.visit_id)}`}
                    title={toVisitTypeLabel(visit.visit_type)}
                    subtitle={`${String(
                      facility?.facility_name || "منشأة غير محددة"
                    )}${building ? ` · ${String(building.building_name || "")}` : ""} · التاريخ: ${String(
                      visit.planned_date || visit.visit_date || "-"
                    )}`}
                    rightBadge={
                      <SoftBadge
                        label={isClosedVisitStatus(visit.visit_status) ? "مغلقة" : "قيد التنفيذ"}
                        tone={badgeTone}
                      />
                    }
                  />
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="استحقاقات الأصول"
          subtitle="الأصول المتأخرة والقريبة التي تحتاج متابعة"
        >
          {dueAssets.length === 0 ? (
            <EmptyPanel
              title="لا توجد استحقاقات حالية"
              description="كل الأصول ضمن المدى الزمني الحالي."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {dueAssets.slice(0, 5).map((asset: any) => (
                <ListRow
                  key={asset.asset_id}
                  href={`/assets/${asset.asset_id}`}
                  title={asset.asset_name}
                  subtitle={`${asset.system_code} · الاستحقاق: ${asset.next_due_date}`}
                  rightBadge={
                    <SoftBadge
                      label={asset.due_label}
                      tone={getDueTone(asset.due_label)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
