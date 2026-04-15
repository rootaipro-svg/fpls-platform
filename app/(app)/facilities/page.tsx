import { AppShell } from "@/components/app-shell";
import AddBuildingForm from "@/components/add-building-form";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [facilities, buildings, systems, systemsRef] = await Promise.all([
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "BUILDING_SYSTEMS"),
    readSheet(workbookId, "SYSTEMS_REF")
  ]);

  const facility = facilities.find((f) => String(f.facility_id) === id);
  const facilityBuildings = buildings.filter((b) => String(b.facility_id) === id);

  const systemOptions = systemsRef
    .filter((s) => String(s.enabled || "").toLowerCase() !== "false")
    .map((s) => ({
      system_code: String(s.system_code),
      system_name: String(s.system_name || s.system_code)
    }));

  return (
    <AppShell title={String(facility?.facility_name || "Facility")}>
      <div className="card">
        <div className="text-sm text-slate-500">Address</div>
        <div className="mt-1 font-medium">
          {String(facility?.address || "No address provided")}
        </div>
        <div className="mt-2 text-sm text-slate-500">
          {String(facility?.city || "")}
          {facility?.district ? ` · ${facility.district}` : ""}
        </div>
      </div>

      <AddBuildingForm
        facilities={[
          {
            facility_id: String(facility?.facility_id || ""),
            facility_name: String(facility?.facility_name || "Facility")
          }
        ]}
        systems={systemOptions}
      />

      {facilityBuildings.length === 0 ? (
        <div className="card">
          <div className="text-lg font-semibold">No buildings yet</div>
          <div className="mt-1 text-sm text-slate-500">
            Add the first building for this facility from the form above.
          </div>
        </div>
      ) : (
        facilityBuildings.map((b) => {
          const buildingSystems = systems.filter(
            (s) => String(s.building_id) === String(b.building_id)
          );

          return (
            <div key={String(b.building_id)} className="card">
              <div className="text-lg font-semibold">{String(b.building_name)}</div>
              <div className="mt-1 text-sm text-slate-500">
                {String(b.building_use || "")} · Floors: {String(b.number_of_floors || "1")}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {buildingSystems.length === 0 ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                    No systems yet
                  </span>
                ) : (
                  buildingSystems.map((s) => (
                    <span
                      key={String(s.building_system_id)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                    >
                      {String(s.system_code)}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
    </AppShell>
  );
}
