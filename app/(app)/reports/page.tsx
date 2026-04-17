import { FileText, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { ReportCard } from "@/components/report-card";
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

export default async function ReportsPage() {
  const actor = await requirePermission("reports", "view");
  const workbookId = actor.workbookId;

  const [visits, visitSystems, responses, findings, facilities, buildings] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "RESPONSES"),
      readSheet(workbookId, "FINDINGS"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
    ]);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(workbookId, actor)
      : null;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
        <PageHeader
          title="التقارير"
          subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
        />
        <EmptyState
          title="تعذر تحميل التقارير"
          description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
          icon={UserRound}
        />
      </AppShell>
    );
  }

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

  const reportRows = sortedVisits.map((visit: any) => {
    const systems = visitSystems.filter(
      (vs: any) => String(vs.visit_id) === String(visit.visit_id)
    );

    const visitSystemIds = new Set(
      systems.map((s: any) => String(s.visit_system_id))
    );

    const visitResponses = responses.filter((r: any) =>
      visitSystemIds.has(String(r.visit_system_id))
    );

    const visitFindings = findings.filter((f: any) =>
      visitSystemIds.has(String(f.visit_system_id))
    );

    const compliantCount = visitResponses.filter(
      (r: any) => String(r.response_value || "").toLowerCase() === "compliant"
    ).length;

    const nonCompliantCount = visitResponses.filter(
      (r: any) => String(r.response_value || "").toLowerCase() === "non_compliant"
    ).length;

    const scoredTotal = compliantCount + nonCompliantCount;
    const compliancePercent =
      scoredTotal > 0 ? Math.round((compliantCount / scoredTotal) * 100) : 0;

    const facility = facilities.find(
      (f: any) => String(f.facility_id) === String(visit.facility_id)
    );

    const building = buildings.find(
      (b: any) => String(b.building_id) === String(visit.building_id)
    );

    const ready =
      String(visit.visit_status || "").toLowerCase() === "closed" &&
      visitResponses.length > 0;

    return {
      visit,
      facilityName: String(facility?.facility_name || "منشأة غير محددة"),
      buildingName: String(building?.building_name || ""),
      compliancePercent,
      findingCount: visitFindings.length,
      ready,
    };
  });

  const orderedRows = [...reportRows].sort((a, b) => {
    if (a.ready !== b.ready) return a.ready ? -1 : 1;

    const aTime = new Date(
      String(a.visit.planned_date || a.visit.visit_date || 0)
    ).getTime();
    const bTime = new Date(
      String(b.visit.planned_date || b.visit.visit_date || 0)
    ).getTime();

    return bTime - aTime;
  });

  const readyCount = reportRows.filter((r) => r.ready).length;
  const closedCount = reportRows.filter(
    (r) => String(r.visit.visit_status || "").toLowerCase() === "closed"
  ).length;
  const totalCount = reportRows.length;

  return (
    <AppShell>
      <PageHeader
        title="التقارير"
        subtitle={
          actor.role === "inspector"
            ? "تقارير زياراتك فقط"
            : "التقارير الجاهزة للطباعة والعرض"
        }
      />

      <div className="stats-grid">
        <StatCard
          label="إجمالي التقارير"
          value={totalCount}
          hint="كل الزيارات القابلة للعرض كتقارير"
          icon={FileText}
          tone="teal"
        />
        <StatCard
          label="جاهز للطباعة"
          value={readyCount}
          hint="الزيارات المغلقة مع نتائج"
          icon={FileText}
          tone="slate"
        />
        <StatCard
          label="مغلقة"
          value={closedCount}
          hint="تم إغلاقها"
          icon={FileText}
          tone="slate"
        />
      </div>

      <section className="card">
        <div className="section-title">
          {actor.role === "inspector" ? "تقاريري" : "قائمة التقارير"}
        </div>

        {orderedRows.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد تقارير"
              description={
                actor.role === "inspector"
                  ? "لا توجد تقارير ناتجة من زياراتك حاليًا."
                  : "لا توجد تقارير جاهزة حتى الآن."
              }
              icon={FileText}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {orderedRows.map((row) => (
              <ReportCard
                key={String(row.visit.visit_id)}
                visit={row.visit}
                facilityName={row.facilityName}
                buildingName={row.buildingName}
                compliancePercent={row.compliancePercent}
                findingCount={row.findingCount}
                ready={row.ready}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
