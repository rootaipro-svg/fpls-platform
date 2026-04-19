import Link from "next/link";
import {
  Building2,
  ClipboardList,
  Plus,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { MetricCard } from "@/components/metric-card";
import { ActionCard } from "@/components/action-card";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import { toSystemLabel, safeText } from "@/lib/display";

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("facilities", "view");

  const [facilities, buildings, buildingSystems, assets, findings] =
    await Promise.all([
      readSheet(actor.workbookId, "FACILITIES"),
      readSheet(actor.workbookId, "BUILDINGS"),
      readSheet(actor.workbookId, "BUILDING_SYSTEMS"),
      readSheet(actor.workbookId, "ASSETS"),
      readSheet(actor.workbookId, "FINDINGS"),
    ]);

  const facility = facilities.find(
    (row: any) => String(row.facility_id) === String(id)
  );

  if (!facility) {
    return (
      <AppShell>
        <PageHero eyebrow="المنشآت" title="المنشأة" subtitle="غير موجودة" />
        <EmptyState title="المنشأة غير موجودة" description="تعذر العثور على المنشأة." />
      </AppShell>
    );
  }

  const facilityBuildings = buildings.filter(
    (b: any) => String(b.facility_id || "") === String(id)
  );

  const buildingIds = new Set(
    facilityBuildings.map((b: any) => String(b.building_id || ""))
  );

  const facilitySystems = buildingSystems.filter((s: any) =>
    buildingIds.has(String(s.building_id || ""))
  );

  const facilityAssets = assets.filter(
    (a: any) => String(a.facility_id || "") === String(id)
  );

  const openFindings = findings.filter(
    (f: any) => String(f.closure_status || f.compliance_status || "").toLowerCase() !== "closed"
  ).length;

  const dueAssets = facilityAssets.filter((asset: any) => {
    const nextDue = String(asset.next_due_date || "");
    return nextDue.length > 0;
  }).length;

  const systemCodes = Array.from(
    new Set(facilityAssets.map((a: any) => String(a.system_code || "")).filter(Boolean))
  );

  return (
    <AppShell>
      <PageHero
        eyebrow="ملف المنشأة والمباني والأنظمة والزيارات المرتبطة بها"
        title={safeText(facility.facility_name, "منشأة")}
        subtitle={safeText(facility.address, safeText(facility.city, "-"))}
      />

      <div className="space-y-4">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">البيانات الأساسية</div>
            <div className="mt-2 text-base text-slate-500">
              {safeText(facility.address, "-")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {safeText(facility.owner_name || facility.manager_name, "Facility Manager")}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {safeText(facility.facility_type, "-")}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {safeText(facility.district, "-")}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {safeText(facility.city, "-")}
            </span>
            {facility.phone ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {String(facility.phone)}
              </span>
            ) : null}
          </div>
        </section>

        <MetricCard
          title="المباني"
          value={facilityBuildings.length}
          subtitle="إجمالي المباني التابعة"
          icon={Building2}
          tone="teal"
        />

        <MetricCard
          title="الأنظمة"
          value={facilitySystems.length}
          subtitle="إجمالي الأنظمة المثبتة"
          icon={Wrench}
          tone="slate"
        />

        <MetricCard
          title="العناصر المستحقة"
          value={dueAssets}
          subtitle="المتأخر واليوم والقريب"
          icon={ClipboardList}
          tone={dueAssets > 0 ? "amber" : "slate"}
        />

        <MetricCard
          title="المخالفات المفتوحة"
          value={openFindings}
          subtitle="تحتاج متابعة"
          icon={ShieldAlert}
          tone={openFindings > 0 ? "red" : "slate"}
        />

        <ActionCard
          href={`/visits/new?facility_id=${encodeURIComponent(String(id))}`}
          title="إنشاء زيارة"
          text="أنشئ زيارة جديدة واختر المبنى والأنظمة والمفتش المسؤول عنها."
          buttonLabel="زيارة جديدة"
          icon={Plus}
        />

        <ActionCard
          href={`/buildings/new?facility_id=${encodeURIComponent(String(id))}`}
          title="إضافة مبنى"
          text="أضف مبنى جديدًا وحدد الأنظمة الموجودة داخله."
          buttonLabel="إضافة مبنى جديد"
          icon={Plus}
        />

        <ActionCard
          href={`/assets/new?facility_id=${encodeURIComponent(String(id))}`}
          title="الأصول والمكونات"
          text="أضف أصلًا أو معدة فعلية تحت نظام محدد، تمهيدًا لربطها بـ QR لاحقًا."
          buttonLabel="إضافة أصل"
          icon={Plus}
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">الأنظمة المثبتة</div>
          </div>

          <div className="flex flex-wrap gap-2">
            {systemCodes.map((code) => (
              <span
                key={code}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {toSystemLabel(code)}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">الأصول المسجلة</div>
          </div>

          {facilityAssets.length === 0 ? (
            <EmptyState
              title="لا توجد أصول"
              description="أضف الأصول الفعلية للمنشأة."
              icon={ClipboardList}
            />
          ) : (
            <div className="space-y-4">
              {facilityAssets.map((asset: any) => (
                <section
                  key={String(asset.asset_id)}
                  className="rounded-[28px] border border-slate-200 bg-white p-5"
                >
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-slate-950">
                      {safeText(asset.asset_name_ar || asset.asset_name, "أصل")}
                    </div>
                    <div className="mt-2 text-base text-slate-500">
                      {toSystemLabel(asset.system_code)} · {safeText(asset.asset_type, "-")}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {safeText(asset.location_note, "-")}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                      QR
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                      {safeText(asset.asset_code || asset.asset_id, "-")}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                      {safeText(asset.status, "active")}
                    </span>
                  </div>

                  <div className="mt-4 text-left">
                    <Link
                      href={`/assets/${asset.asset_id}`}
                      className="text-sm font-bold text-teal-700"
                    >
                      عرض الأصل
                    </Link>
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
