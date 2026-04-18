import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import AssetsBrowser from "@/components/assets-browser";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function AssetsPage() {
  const actor = await requirePermission("facilities", "view");
  const workbookId = actor.workbookId;

  const [assets, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const rows = [...assets]
    .map((asset) => {
      const facility = facilities.find(
        (f) => String(f.facility_id) === String(asset.facility_id || "")
      );

      const building = buildings.find(
        (b) => String(b.building_id) === String(asset.building_id || "")
      );

      return {
        asset_id: String(asset.asset_id || ""),
        asset_code: String(asset.asset_code || ""),
        asset_name: String(asset.asset_name || ""),
        asset_name_ar: String(asset.asset_name_ar || ""),
        system_code: String(asset.system_code || ""),
        status: String(asset.status || "active"),
        facility_id: String(asset.facility_id || ""),
        facility_name: String(facility?.facility_name || ""),
        building_id: String(asset.building_id || ""),
        building_name: String(building?.building_name || ""),
        location_note: String(asset.location_note || ""),
      };
    })
    .sort((a, b) =>
      String(
        a.asset_name_ar || a.asset_name || a.asset_code || a.asset_id || ""
      ).localeCompare(
        String(
          b.asset_name_ar || b.asset_name || b.asset_code || b.asset_id || ""
        ),
        "ar"
      )
    );

  return (
    <AppShell>
      <PageHeader
        title="الأصول"
        subtitle="قائمة جميع الأصول والمكونات المسجلة في هذا العميل"
      />

      <section className="card">
        <div className="section-header-row">
          <div>
            <div className="section-title">لوحة الأصول</div>
            <div className="section-subtitle">
              عرض الأصول، البحث والتصفية، والطباعة الجماعية لملصقات QR
            </div>
          </div>

          <Link href="/assets/labels" className="btn btn-secondary">
            طباعة ملصقات QR
          </Link>
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="card">
          <EmptyState
            title="لا توجد أصول"
            description="أضف أصلًا من صفحة المنشأة أولًا، ثم سيظهر هنا."
          />
        </section>
      ) : (
        <AssetsBrowser rows={rows} />
      )}
    </AppShell>
  );
}
