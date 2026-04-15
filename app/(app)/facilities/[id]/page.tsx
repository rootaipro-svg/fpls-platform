import { Building2, MapPin, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import AddBuildingForm from "@/components/add-building-form";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [facilities, buildings, systems, systemsRef] = await Promise.all([
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "BUILDING_SYSTEMS"),
    readSheet(workbookId, "SYSTEMS_REF"),
  ]);

  const facility = facilities.find((f) => String(f.facility_id) === id);
  const facilityBuildings = buildings.filter((b) => String(b.facility_id) === id);

  const systemOptions = systemsRef
    .filter((s) => String(s.enabled || "").toLowerCase() !== "false")
    .map((s) => ({
      system_code: String(s.system_code),
      system_name: String(s.system_name || s.system_code),
    }));

  return (
    <AppShell>
      <PageHeader
        title={String(facility?.facility_name || "تفاصيل المنشأة")}
        subtitle="بيانات المنشأة والمباني والأنظمة المرتبطة"
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <MapPin className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-500">العنوان</div>
            <div className="mt-1 break-words text-base font-semibold text-slate-900">
              {String(facility?.address || "لا يوجد عنوان مسجل")}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {String(facility?.city || "")}
              {facility?.district ? ` · ${facility.district}` : ""}
            </div>
          </div>
        </div>
      </div>

      <AddBuildingForm
        facilities={[
          {
            facility_id: String(facility?.facility_id || ""),
            facility_name: String(facility?.facility_name || "Facility"),
          },
        ]}
        systems={systemOptions}
      />

      {facilityBuildings.length === 0 ? (
        <EmptyState
          title="لا توجد مبانٍ بعد"
          description="أضف أول مبنى لهذه المنشأة، ثم اختر الأنظمة الموجودة داخله."
          icon={Building2}
        />
      ) : (
        <div className="space-y-3">
          {facilityBuildings.map((b) => {
            const buildingSystems = systems.filter(
              (s) => String(s.building_id) === String(b.building_id)
            );

            return (
              <div
                key={String(b.building_id)}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-slate-900">
                      {String(b.building_name)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {String(b.building_use || "-")} · الأدوار:{" "}
                      {String(b.number_of_floors || "1")}
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {String(b.status || "active")}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-teal-700" />
                    الأنظمة المرتبطة
                  </div>

                  {buildingSystems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                      لا توجد أنظمة مرتبطة بهذا المبنى
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {buildingSystems.map((s) => (
                        <span
                          key={String(s.building_system_id)}
                          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                        >
                          {String(s.system_code)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
