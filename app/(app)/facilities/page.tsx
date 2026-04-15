import { AppShell } from "@/components/app-shell";
import { FacilityCard } from "@/components/facility-card";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function FacilitiesPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);
  const facilities = await readSheet(workbookId, "FACILITIES");

  return (
    <AppShell title="Facilities">
      {facilities.map((facility) => (
        <FacilityCard key={String(facility.facility_id)} facility={facility} />
      ))}
    </AppShell>
  );
}
