import { FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { ReportCard } from "@/components/report-card";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function ReportsPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [visits, visitSystems, responses, findings, facilities, buildings] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "RESPONSES"),
      readSheet(workbookId, "FINDINGS"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
    ]);

  const sortedVisits = sortByDateDesc(visits, "planned_date");

  const reportRows = sortedVisits.map((visit) => {
    const systems = visitSystems.filter(
      (vs) => String(vs.visit_id) === String(visit.visit_id)
    );

    const visitSystemIds = new Set(
      systems.map((s) => String(s.visit_system_id))
    );

    const visitResponses = responses.filter((r) =>
      visitSystemIds.has(String(r.visit_system_id))
    );

    const visitFindings = findings.filter((f) =>
      visitSystemIds.has(String(f.visit_system_id))
    );

    const compliantCount = visitResponses.filter(
      (r) => String(r.response_value || "").toLowerCase() === "compliant"
    ).length;

    const nonCompliantCount = visitResponses.filter(
      (r) => String(r.response_value || "").toLowerCase() === "non_compliant"
    ).length;

    const scoredTotal = compliantCount + nonCompliantCount;
    const compliancePercent =
      scoredTotal > 0 ? Math.round((compliantCount / scoredTotal) * 100) : 0;

    const facility = facilities.find(
      (f) => String(f.facility_id) === String(visit.facility_id)
    );

    const building = buildings.find(
      (b) => String(b.building_id) === String(visit.building_id)
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

  const readyCount = reportRows.filter((r) => r.ready).length;
  const closedCount = reportRows.filter(
    (r) => String(r.visit.visit_status || "").toLowerCase() === "closed"
  ).length;
  const totalCount = reportRows.length;

  return (
    <AppShell>
      <PageHeader
        title="التقارير"
        subtitle="مركز التقارير القابلة للطباعة والحفظ PDF"
      />

      <div className="stats-grid">
        <StatCard
          label="جاهز للطباعة"
          value={readyCount}
          hint="زيارات مغلقة وبنتائج مكتملة"
          icon={FileText}
          tone="teal"
        />
        <StatCard
          label="زيارات مغلقة"
          value={closedCount}
          hint="يمكن تجهيزها كتقارير"
          icon={FileText}
          tone="slate"
        />
        <StatCard
          label="إجمالي الزيارات"
          value={totalCount}
          hint="كل الزيارات المسجلة"
          icon={FileText}
          tone="slate"
        />
      </div>

      {reportRows.length === 0 ? (
        <EmptyState
          title="لا توجد تقارير بعد"
          description="بعد إنشاء زيارات وتسجيل نتائجها ستظهر التقارير هنا."
          icon={FileText}
        />
      ) : (
        <div className="report-list-grid">
          {reportRows.map((row) => (
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
    </AppShell>
  );
}
