import { ClipboardList, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { MetricCard } from "@/components/metric-card";
import { ActionCard } from "@/components/action-card";
import { VisitCard } from "@/components/visit-card";
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

  const openCount = sortedVisits.filter((v: any) => {
    const status = String(v.visit_status || "").toLowerCase();
    return status !== "closed" && status !== "completed";
  }).length;

  const closedCount = sortedVisits.filter((v: any) => {
    const status = String(v.visit_status || "").toLowerCase();
    return status === "closed" || status === "completed";
  }).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="إدارة كل الزيارات داخل النظام"
        title="الزيارات"
        subtitle="متابعة الزيارات المفتوحة والمغلقة وسرعة الوصول إلى التنفيذ"
      />

      <div className="space-y-4">
        <MetricCard
          title="إجمالي الزيارات"
          value={sortedVisits.length}
          subtitle="كل الزيارات المعروضة"
          icon={ClipboardList}
          tone="teal"
        />

        <MetricCard
          title="مفتوحة"
          value={openCount}
          subtitle="قيد التنفيذ أو مجدولة"
          icon={ClipboardList}
          tone="slate"
        />

        <MetricCard
          title="مغلقة"
          value={closedCount}
          subtitle="تم إغلاقها"
          icon={ClipboardList}
          tone="slate"
        />

        {actor.role !== "inspector" ? (
          <ActionCard
            href="/visits/new"
            title="إنشاء زيارة"
            text="أنشئ زيارة جديدة واختر المبنى والأنظمة والمفتش المسؤول عنها."
            buttonLabel="زيارة جديدة"
            icon={Plus}
          />
        ) : null}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">
              سجل المهام والزيارات
            </div>
            <div className="mt-2 text-base text-slate-500">
              متابعة سريعة لأحدث الحركة التشغيلية
            </div>
          </div>

          {sortedVisits.length === 0 ? (
            <EmptyState
              title="لا توجد زيارات"
              description="لم يتم إنشاء أي زيارة حتى الآن."
              icon={ClipboardList}
            />
          ) : (
            <div className="space-y-4">
              {sortedVisits.map((visit: any) => {
                const facility = facilities.find(
                  (f: any) =>
                    String(f.facility_id) === String(visit.facility_id || "")
                );
                const building = buildings.find(
                  (b: any) =>
                    String(b.building_id) === String(visit.building_id || "")
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
        </section>
      </div>
    </AppShell>
  );
}
