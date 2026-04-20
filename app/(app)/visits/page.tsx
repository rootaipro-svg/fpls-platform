import { ClipboardList, Clock3, PlusCircle, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  ActionCard,
  EmptyPanel,
  MetricCard,
  PageHero,
  SectionCard,
} from "@/components/admin-page-kit";
import { VisitCard } from "@/components/visit-card";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";
import { isClosedVisitStatus } from "@/lib/display";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function VisitsPage() {
  const actor = await requirePermission("visits", "view");

  const [visits, facilities, buildings] = await Promise.all([
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
  ]);

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

  const sortedVisits = sortByDateDesc(visibleVisits, "planned_date");
  const openCount = sortedVisits.filter((v: any) => !isClosedVisitStatus(v.visit_status)).length;
  const closedCount = sortedVisits.filter((v: any) => isClosedVisitStatus(v.visit_status)).length;
  const unassignedCount =
    actor.role === "inspector"
      ? 0
      : sortedVisits.filter(
          (v: any) =>
            !isClosedVisitStatus(v.visit_status) &&
            !String(v.assigned_inspector_id || "").trim()
        ).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="إدارة كل الزيارات داخل النظام"
        title="الزيارات"
        subtitle="متابعة الزيارات المجدولة والجارية والمغلقة"
        icon={ClipboardList}
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
          label="إجمالي الزيارات"
          value={sortedVisits.length}
          hint="كل الزيارات المعروضة"
          icon={ClipboardList}
          tone="teal"
        />
        <MetricCard
          label="مفتوحة"
          value={openCount}
          hint="قيد التنفيذ أو مجدولة"
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          label="مغلقة"
          value={closedCount}
          hint="تم إغلاقها"
          icon={ClipboardList}
          tone="slate"
        />
        <MetricCard
          label="غير مسندة"
          value={unassignedCount}
          hint="تحتاج تعيين مفتش"
          icon={UserRound}
          tone={unassignedCount > 0 ? "amber" : "slate"}
        />
      </div>

      {actor.role !== "inspector" ? (
        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="إنشاء زيارة"
            subtitle="أنشئ زيارة جديدة وحدد المبنى والأنظمة والمفتش المسؤول"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <ActionCard href="/visits/new" title="زيارة جديدة" icon={PlusCircle} tone="teal" />
              <ActionCard href="/unassigned-visits" title="توزيع المهام" icon={UserRound} tone="amber" />
            </div>
          </SectionCard>
        </div>
      ) : null}

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="قائمة الزيارات"
          subtitle="الوصول المباشر إلى كل زيارة وحالتها الحالية"
        >
          {sortedVisits.length === 0 ? (
            <EmptyPanel
              title="لا توجد زيارات"
              description="بعد إنشاء زيارة جديدة ستظهر هنا مباشرة."
            />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {sortedVisits.map((visit: any) => {
                const facility = facilities.find(
                  (f: any) =>
                    String(f.facility_id || "") === String(visit.facility_id || "")
                );
                const building = buildings.find(
                  (b: any) =>
                    String(b.building_id || "") === String(visit.building_id || "")
                );

                return (
                  <VisitCard
                    key={String(visit.visit_id)}
                    visit={visit}
                    facilityName={String(facility?.facility_name || "")}
                    buildingName={String(building?.building_name || "")}
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
