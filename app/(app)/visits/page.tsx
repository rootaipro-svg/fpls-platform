import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { VisitCard } from "@/components/visit-card";
import CreateVisitForm from "@/components/create-visit-form";
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

export default async function VisitsPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [visits, facilities, buildings, buildingSystems, inspectors] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
      readSheet(workbookId, "BUILDING_SYSTEMS"),
      readSheet(workbookId, "INSPECTORS"),
    ]);

  const sortedVisits = sortByDateDesc(visits, "planned_date");

  return (
    <AppShell>
      <PageHeader
        title="الزيارات"
        subtitle="إدارة الزيارات المجدولة والمنفذة وربطها بالأنظمة"
      />

      <CreateVisitForm
        facilities={facilities.map((f) => ({
          facility_id: String(f.facility_id),
          facility_name: String(f.facility_name),
        }))}
        buildings={buildings.map((b) => ({
          building_id: String(b.building_id),
          facility_id: String(b.facility_id),
          building_name: String(b.building_name),
        }))}
        buildingSystems={buildingSystems.map((s) => ({
          building_system_id: String(s.building_system_id),
          building_id: String(s.building_id),
          system_code: String(s.system_code),
        }))}
        inspectors={inspectors.map((i) => ({
          inspector_id: String(i.inspector_id),
          inspector_name: String(i.inspector_name || i.full_name || i.inspector_id),
        }))}
      />

      {sortedVisits.length === 0 ? (
        <EmptyState
          title="لا توجد زيارات"
          description="ابدأ بإنشاء أول زيارة تفتيش، ثم ستظهر هنا قائمة الزيارات."
          icon={ClipboardList}
        />
      ) : (
        <div className="stack-3">
          {sortedVisits.map((visit) => {
            const facility = facilities.find(
              (f) => String(f.facility_id) === String(visit.facility_id)
            );

            const building = buildings.find(
              (b) => String(b.building_id) === String(visit.building_id)
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
    </AppShell>
  );
}
