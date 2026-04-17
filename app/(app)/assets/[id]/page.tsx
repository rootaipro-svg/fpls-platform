import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import EditAssetForm from "@/components/edit-asset-form";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("facilities", "view");
  const workbookId = actor.workbookId;

  const [assets, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const asset = assets.find((row) => String(row.asset_id) === String(id));

  if (!asset) {
    return (
      <AppShell>
        <PageHeader title="تفاصيل الأصل" subtitle={`رقم الأصل: ${String(id)}`} />
        <EmptyState
          title="الأصل غير موجود"
          description="تعذر العثور على الأصل المطلوب."
        />
      </AppShell>
    );
  }

  const facility = facilities.find(
    (row) => String(row.facility_id) === String(asset.facility_id || "")
  );

  const building = buildings.find(
    (row) => String(row.building_id) === String(asset.building_id || "")
  );

  return (
    <AppShell>
      <PageHeader
        title={String(asset.asset_name_ar || asset.asset_name || "تفاصيل الأصل")}
        subtitle={`الأصل: ${String(asset.asset_code || asset.asset_id || "-")}`}
      />

      <section className="card">
        <div className="section-title">بيانات الأصل</div>

        <div className="stack-3" style={{ marginTop: "14px" }}>
          <div>
            <div className="text-sm text-slate-500">الاسم</div>
            <div className="mt-1 font-medium">
              {String(asset.asset_name_ar || asset.asset_name || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">النظام</div>
            <div className="mt-1 font-medium">
              {String(asset.system_code || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">المنشأة / المبنى</div>
            <div className="mt-1 font-medium">
              {String(facility?.facility_name || "-")}
              {building ? ` · ${String(building.building_name || "")}` : ""}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">نوع الأصل</div>
            <div className="mt-1 font-medium">
              {String(asset.asset_type || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">الموقع</div>
            <div className="mt-1 font-medium">
              {String(asset.location_note || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">الحالة</div>
            <div className="mt-1 font-medium">
              {String(asset.status || "active")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">قيمة QR</div>
            <div className="mt-1 font-medium" style={{ wordBreak: "break-all" }}>
              {String(asset.qr_code_value || "-")}
            </div>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: "16px" }}>
          <Link href={`/assets/${id}/qr`} className="btn">
            عرض QR
          </Link>

          <Link
            href={`/facilities/${String(asset.facility_id || "")}`}
            className="btn btn-secondary"
          >
            العودة للمنشأة
          </Link>
        </div>
      </section>

      <EditAssetForm
        asset={{
          asset_id: String(asset.asset_id || ""),
          asset_code: String(asset.asset_code || ""),
          asset_name: String(asset.asset_name || ""),
          asset_name_ar: String(asset.asset_name_ar || ""),
          asset_type: String(asset.asset_type || ""),
          location_note: String(asset.location_note || ""),
          status: String(asset.status || "active"),
        }}
      />
    </AppShell>
  );
}
