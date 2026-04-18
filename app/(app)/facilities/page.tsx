import Link from "next/link";
import { Building2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { FacilityCard } from "@/components/facility-card";
import AddFacilityForm from "@/components/add-facility-form";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function FacilitiesPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [facilities, buildings, systems] = await Promise.all([
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "BUILDING_SYSTEMS"),
  ]);

  return (
    <AppShell>
      <PageHeader
        title="المنشآت"
        subtitle="إدارة المنشآت والمباني والأنظمة المرتبطة بها"
      />

      <section className="card">
        <div className="section-header-row">
          <div>
            <div className="section-title">اختصارات سريعة</div>
            <div className="section-subtitle">
              انتقال مباشر إلى لوحة الأصول وإدارة ملصقات QR
            </div>
          </div>

          <Link href="/assets" className="btn btn-secondary">
            فتح لوحة الأصول
          </Link>
        </div>
      </section>

      <AddFacilityForm />

      {facilities.length === 0 ? (
        <EmptyState
          title="لا توجد منشآت"
          description="ابدأ بإضافة أول منشأة لتكوين قاعدة البيانات التشغيلية."
          icon={Building2}
        />
      ) : (
        <div className="space-y-3">
          {facilities.map((facility) => {
            const facilityBuildings = buildings.filter(
              (b) => String(b.facility_id) === String(facility.facility_id)
            );

            const buildingIds = new Set(
              facilityBuildings.map((b) => String(b.building_id))
            );

            const facilitySystems = systems.filter((s) =>
              buildingIds.has(String(s.building_id))
            );

            return (
              <FacilityCard
                key={String(facility.facility_id)}
                facility={facility}
                buildingCount={facilityBuildings.length}
                systemCount={facilitySystems.length}
              />
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
