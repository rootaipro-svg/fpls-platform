import Link from "next/link";
import { Building2, Plus, QrCode } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { MetricCard } from "@/components/metric-card";
import { ActionCard } from "@/components/action-card";
import { FacilityCard } from "@/components/facility-card";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function FacilitiesPage() {
  const actor = await requirePermission("facilities", "view");

  const [facilities, buildings, buildingSystems, assets] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
    readSheet(actor.workbookId, "BUILDING_SYSTEMS"),
    readSheet(actor.workbookId, "ASSETS"),
  ]);

  const activeFacilities = facilities.filter(
    (f: any) => String(f.status || "active").toLowerCase() === "active"
  ).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="إدارة المنشآت والمباني والأنظمة المرتبطة بها"
        title="المنشآت"
        subtitle="عرض موحد ومختصر للمنشآت المسجلة داخل النظام"
      />

      <div className="space-y-4">
        <MetricCard
          title="إجمالي المنشآت"
          value={facilities.length}
          subtitle="كل المنشآت المسجلة"
          icon={Building2}
          tone="teal"
        />

        <MetricCard
          title="المنشآت النشطة"
          value={activeFacilities}
          subtitle="المنشآت الفعالة حاليًا"
          icon={Building2}
          tone="slate"
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">
              اختصارات سريعة
            </div>
            <div className="mt-2 text-base text-slate-500">
              انتقال مباشر إلى لوحة الأصول وإدارة ملصقات QR
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/assets"
              className="rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-sm"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-600">
                <Building2 size={28} />
              </div>
              <div className="mt-4 text-2xl font-extrabold text-slate-950">
                فتح لوحة الأصول
              </div>
            </Link>

            <Link
              href="/assets/labels"
              className="rounded-[24px] border border-slate-200 bg-white p-5 text-center shadow-sm"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-600">
                <QrCode size={28} />
              </div>
              <div className="mt-4 text-2xl font-extrabold text-slate-950">
                ملصقات QR
              </div>
            </Link>
          </div>
        </section>

        <ActionCard
          href="/facilities/new"
          title="إضافة منشأة"
          text="سجل منشأة جديدة داخل النظام مع بياناتها الأساسية."
          buttonLabel="منشأة جديدة"
          icon={Plus}
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">قائمة المنشآت</div>
            <div className="mt-2 text-base text-slate-500">
              عرض موحد ومختصر للمنشآت المسجلة داخل النظام
            </div>
          </div>

          {facilities.length === 0 ? (
            <EmptyState
              title="لا توجد منشآت"
              description="أضف أول منشأة لتبدأ العمل."
              icon={Building2}
            />
          ) : (
            <div className="space-y-4">
              {facilities.map((facility: any) => {
                const buildingCount = buildings.filter(
                  (b: any) =>
                    String(b.facility_id || "") === String(facility.facility_id || "")
                ).length;

                const facilityBuildingIds = new Set(
                  buildings
                    .filter(
                      (b: any) =>
                        String(b.facility_id || "") === String(facility.facility_id || "")
                    )
                    .map((b: any) => String(b.building_id))
                );

                const systemCount = buildingSystems.filter((s: any) =>
                  facilityBuildingIds.has(String(s.building_id || ""))
                ).length;

                const assetCount = assets.filter(
                  (a: any) =>
                    String(a.facility_id || "") === String(facility.facility_id || "")
                ).length;

                return (
                  <FacilityCard
                    key={String(facility.facility_id)}
                    facility={facility}
                    buildingCount={buildingCount}
                    systemCount={systemCount}
                    assetCount={assetCount}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
