import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
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

  const rows = [...assets].sort((a, b) =>
    String(a.asset_name_ar || a.asset_name || a.asset_code || "").localeCompare(
      String(b.asset_name_ar || b.asset_name || b.asset_code || ""),
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
            <div className="section-title">جميع الأصول</div>
            <div className="section-subtitle">
              يمكنك فتح الأصل أو طباعة ملصقات QR لكل الأصول
            </div>
          </div>

          <Link href="/assets/labels" className="btn btn-secondary">
            طباعة ملصقات QR
          </Link>
        </div>

        {rows.length === 0 ? (
          <div style={{ marginTop: "14px" }}>
            <EmptyState
              title="لا توجد أصول"
              description="أضف أصلًا من صفحة المنشأة أولًا."
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "14px" }}>
            {rows.map((asset) => {
              const facility = facilities.find(
                (f) => String(f.facility_id) === String(asset.facility_id || "")
              );

              const building = buildings.find(
                (b) => String(b.building_id) === String(asset.building_id || "")
              );

              return (
                <div key={String(asset.asset_id)} className="system-line">
                  <div className="system-line-top">
                    <div>
                      <div className="system-line-title">
                        <Link href={`/assets/${String(asset.asset_id)}`}>
                          {String(
                            asset.asset_name_ar ||
                              asset.asset_name ||
                              asset.asset_code ||
                              asset.asset_id
                          )}
                        </Link>
                      </div>

                      <div className="system-line-date">
                        {String(asset.system_code || "-")}
                        {facility ? ` · ${String(facility.facility_name || "")}` : ""}
                        {building ? ` · ${String(building.building_name || "")}` : ""}
                      </div>
                    </div>

                    <div className="badge-wrap">
                      <span className="badge">
                        {String(asset.status || "active")}
                      </span>
                      <Link
                        href={`/assets/${String(asset.asset_id)}/qr`}
                        className="badge"
                      >
                        QR
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
