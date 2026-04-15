import { AppShell } from "@/components/app-shell";
import { FacilityCard } from "@/components/facility-card";
import AddFacilityForm from "@/components/add-facility-form";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function FacilitiesPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);
  const facilities = await readSheet(workbookId, "FACILITIES");

  return (
    <AppShell title="Facilities">
      <AddFacilityForm />

      <div className="space-y-3">
        {facilities.length === 0 ? (
          <div className="card">
            <div className="text-lg font-semibold">No facilities yet</div>
            <div className="mt-1 text-sm text-slate-500">
              Start by creating your first facility from the form above.
            </div>
          </div>
        ) : (
          facilities.map((facility) => (
            <FacilityCard
              key={String(facility.facility_id)}
              facility={facility}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}
