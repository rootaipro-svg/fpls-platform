import { FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { MetricCard } from "@/components/metric-card";
import { VisitCard } from "@/components/visit-card";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function ReportsPage() {
  const actor = await requirePermission("reports", "view");

  const [visits, facilities, buildings] = await Promise.all([
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
  ]);

  const reportVisits = visits.filter((visit: any) => {
    const status = String(visit.visit_status || "").toLowerCase();
    return status === "closed" || status === "completed";
  });

  const readyCount = reportVisits.filter(
    (v: any) => String(v.summary_result || "").trim().length > 0
  ).length;

  const sortedVisits = sortByDateDesc(reportVisits, "visit_date");

  return (
    <AppShell>
      <PageHero
        eyebrow="التقارير الجاهزة للطباعة والعرض"
        title="التقارير"
        subtitle="كل الزيارات المغلقة القابلة للعرض كتقارير"
      />

      <div className="space-y-4">
        <MetricCard
          title="إجمالي التقارير"
          value={reportVisits.length}
          subtitle="كل الزيارات القابلة للعرض كتقارير"
          icon={FileText}
          tone="teal"
        />

        <MetricCard
          title="جاهز للطباعة"
          value={readyCount}
          subtitle="الزيارات المغلقة مع نتائج"
          icon={FileText}
          tone="slate"
        />

        <MetricCard
          title="مغلقة"
          value={reportVisits.length}
          subtitle="تم إغلاقها"
          icon={FileText}
          tone="slate"
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">
              قائمة التقارير
            </div>
          </div>

          {sortedVisits.length === 0 ? (
            <EmptyState
              title="لا توجد تقارير"
              description="أغلق زيارة مع نتائج حتى تظهر هنا."
              icon={FileText}
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
