import { ClipboardList, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { VisitCard } from "@/components/visit-card";
import CreateVisitForm from "@/components/create-visit-form";
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

  const [visits, facilities, buildings, buildingSystems, inspectors] =
    await Promise.all([
      readSheet(actor.workbookId, "VISITS"),
      readSheet(actor.workbookId, "FACILITIES"),
      readSheet(actor.workbookId, "BUILDINGS"),
      readSheet(actor.workbookId, "BUILDING_SYSTEMS"),
      readSheet(actor.workbookId, "INSPECTORS"),
    ]);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(actor.workbookId, actor)
      : null;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
        <PageHeader
          title="زياراتي"
          subtitle="لم يتم ربط هذا الحساب بسجل مفتش داخل INSPECTORS"
        />

        <EmptyState
          title="لا يوجد ملف مفتش"
          description="أضف app_user_id أو email الصحيح داخل شيت INSPECTORS ثم أعد المحاولة."
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

  const openCount = visibleVisits.filter((visit: any) => {
    const status = String(visit.visit_status || "").toLowerCase();
    return status !== "closed" && status !== "completed";
  }).length;

  const closedCount = visibleVisits.filter((visit: any) => {
    const status = String(visit.visit_status || "").toLowerCase();
    return status === "closed" || status === "completed";
  }).length;

  return (
    <AppShell>
      <PageHeader
        title={actor.role === "inspector" ? "زياراتي" : "الزيارات"}
        subtitle={
          actor.role === "inspector"
            ? "الزيارات المعيّنة لك فقط"
            : "إدارة كل الزيارات داخل النظام"
        }
      />

      <div className="stats-grid">
        <StatCard
          label={actor.role === "inspector" ? "زياراتي" : "إجمالي الزيارات"}
          value={visibleVisits.length}
          hint="كل الزيارات المعروضة"
          icon={ClipboardList}
          tone="teal"
        />
        <StatCard
          label="مفتوحة"
          value={openCount}
          hint="قيد التنفيذ أو مجدولة"
          icon={ClipboardList}
          tone="slate"
        />
        <StatCard
          label="مغلقة"
          value={closedCount}
          hint="تم إغلاقها"
          icon={ClipboardList}
          tone="slate"
        />
      </div>

      {actor.role !== "inspector" ? (
        <CreateVisitForm
          facilities={facilities.map((f: any) => ({
            facility_id: String(f.facility_id || ""),
            facility_name: String(f.facility_name || ""),
          }))}
          buildings={buildings.map((b: any) => ({
            building_id: String(b.building_id || ""),
            facility_id: String(b.facility_id || ""),
            building_name: String(b.building_name || ""),
          }))}
          buildingSystems={buildingSystems.map((s: any) => ({
            building_system_id: String(s.building_system_id || ""),
            building_id: String(s.building_id || ""),
            system_code: String(s.system_code || ""),
          }))}
          inspectors={inspectors.map((i: any) => ({
            inspector_id: String(i.inspector_id || ""),
            inspector_name: String(
              i.full_name_ar || i.full_name || i.email || i.inspector_id || "Inspector"
            ),
            email: String(i.email || ""),
            phone: String(i.phone || ""),
            status: String(i.status || "active"),
            allowed_systems: String(i.allowed_systems || ""),
          }))}
        />
      ) : (
        <div className="card">
          <div className="section-title">المفتش الحالي</div>
          <div className="section-subtitle">
            {String(
              currentInspector?.full_name_ar ||
                currentInspector?.full_name ||
                currentInspector?.email ||
                "Inspector"
            )}
          </div>
        </div>
      )}

      <section className="card">
        <div className="section-title">
          {actor.role === "inspector" ? "الزيارات المعيّنة لك" : "قائمة الزيارات"}
        </div>

        {sortedVisits.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد زيارات"
              description={
                actor.role === "inspector"
                  ? "لا توجد زيارات مخصصة لك حاليًا."
                  : "لا توجد زيارات في النظام حتى الآن."
              }
              icon={ClipboardList}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
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
    </AppShell>
  );
}
