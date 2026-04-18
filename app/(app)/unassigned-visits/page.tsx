import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import AssignVisitInspectorForm from "@/components/assign-visit-inspector-form";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

function parseAllowedSystems(value: any): string[] {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sortByDateAsc(rows: any[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.planned_date || a?.visit_date || 0)).getTime();
    const bTime = new Date(String(b?.planned_date || b?.visit_date || 0)).getTime();
    return aTime - bTime;
  });
}

export default async function UnassignedVisitsPage() {
  const actor = await requirePermission("visits", "update");
  const workbookId = actor.workbookId;

  if (String(actor.role || "").toLowerCase() === "inspector") {
    return (
      <AppShell>
        <PageHeader
          title="الزيارات غير المسندة"
          subtitle="غير مصرح"
        />
        <EmptyState
          title="هذه الصفحة خاصة بالإدارة"
          description="المفتش لا يدير إسناد الزيارات."
          icon={ClipboardList}
        />
      </AppShell>
    );
  }

  const [visits, visitSystems, facilities, buildings, inspectors] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
      readSheet(workbookId, "INSPECTORS"),
    ]);

  const openUnassignedVisits = sortByDateAsc(
    visits.filter((visit: any) => {
      const status = String(visit.visit_status || "").toLowerCase();
      const assigned = String(visit.assigned_inspector_id || "").trim();

      return (
        status !== "closed" &&
        status !== "completed" &&
        assigned.length === 0
      );
    })
  );

  const rows = openUnassignedVisits.map((visit: any) => {
    const visitId = String(visit.visit_id || "");
    const facility = facilities.find(
      (row: any) =>
        String(row.facility_id || "") === String(visit.facility_id || "")
    );
    const building = buildings.find(
      (row: any) =>
        String(row.building_id || "") === String(visit.building_id || "")
    );

    const systemsForVisit = visitSystems.filter(
      (row: any) => String(row.visit_id || "") === visitId
    );

    const systemCodes = [
      ...new Set(
        systemsForVisit
          .map((row: any): string => String(row.system_code || "").trim())
          .filter((value: string): boolean => value.length > 0)
      ),
    ];

    const eligibleInspectors = inspectors
      .filter((inspector: any) => {
        const status = String(inspector.status || "active").toLowerCase();
        if (status !== "active") return false;

        const allowedSystems = parseAllowedSystems(inspector.allowed_systems);

        return (
          allowedSystems.includes("*") ||
          systemCodes.every((code) => allowedSystems.includes(code))
        );
      })
      .map((inspector: any) => ({
        inspector_id: String(inspector.inspector_id || ""),
        inspector_name: String(
          inspector.full_name_ar ||
            inspector.full_name ||
            inspector.email ||
            inspector.inspector_id ||
            "Inspector"
        ),
      }));

    return {
      visit_id: visitId,
      visit_type: String(visit.visit_type || "زيارة"),
      planned_date: String(visit.planned_date || visit.visit_date || ""),
      facility_name: String(facility?.facility_name || ""),
      building_name: String(building?.building_name || ""),
      system_codes: systemCodes,
      inspectors: eligibleInspectors,
    };
  });

  return (
    <AppShell>
      <PageHeader
        title="الزيارات غير المسندة"
        subtitle="إسناد سريع للزيارات المفتوحة التي لا يوجد لها مفتش معين"
      />

      <section className="card">
        <div className="section-header-row">
          <div>
            <div className="section-title">تشغيل سريع</div>
            <div className="section-subtitle">
              يمكنك من هنا إسناد المفتش المناسب لكل زيارة مفتوحة غير مسندة
            </div>
          </div>

          <div className="badge-wrap">
            <span className="badge">العدد: {rows.length}</span>
            <Link href="/visits" className="badge">
              كل الزيارات
            </Link>
          </div>
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="card">
          <EmptyState
            title="لا توجد زيارات غير مسندة"
            description="كل الزيارات المفتوحة الحالية مسندة لمفتشين."
            icon={ClipboardList}
          />
        </section>
      ) : (
        <AssignVisitInspectorForm visits={rows} />
      )}
    </AppShell>
  );
}
