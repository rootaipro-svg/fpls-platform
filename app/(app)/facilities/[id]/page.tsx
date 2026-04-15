import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);
  const [facilities, buildings, systems] = await Promise.all([
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "BUILDING_SYSTEMS")
  ]);

  const facility = facilities.find(f => String(f.facility_id) === id);
  const facilityBuildings = buildings.filter(b => String(b.facility_id) === id);

  return (
    <AppShell title={String(facility?.facility_name || "Facility") }>
      <div className="card">
        <div className="text-sm text-slate-500">Address</div>
        <div className="mt-1 font-medium">{String(facility?.address || "")}</div>
      </div>

      {facilityBuildings.map((b) => {
        const buildingSystems = systems.filter(s => String(s.building_id) === String(b.building_id));
        return (
          <div key={String(b.building_id)} className="card">
            <div className="text-lg font-semibold">{String(b.building_name)}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {buildingSystems.map((s) => (
                <span key={String(s.building_system_id)} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                  {String(s.system_code)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </AppShell>
  );
}
