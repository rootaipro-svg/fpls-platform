import Link from "next/link";
import { AlertTriangle, Boxes, FileImage, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import AssetsBrowser from "@/components/assets-browser";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function AssetsPage() {
  const actor = await requirePermission("facilities", "view");
  const workbookId = actor.workbookId;

  const [assets, facilities, buildings, findings, evidence] = await Promise.all([
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "EVIDENCE"),
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

  const openFindingAssetIds = new Set(
    findings
      .filter(
        (f) =>
          String(f.asset_id || "").trim() &&
          String(f.closure_status || f.compliance_status || "").toLowerCase() !==
            "closed"
      )
      .map((f) => String(f.asset_id))
  );

  const evidenceAssetIds = new Set(
    evidence
      .filter((e) => String(e.asset_id || "").trim())
      .map((e) => String(e.asset_id))
  );

  const totalAssets = rows.length;
  const assetsWithOpenFindings = rows.filter((r) =>
    openFindingAssetIds.has(String(r.asset_id))
  ).length;
  const assetsWithoutEvidence = rows.filter(
    (r) => !evidenceAssetIds.has(String(r.asset_id))
  ).length;
  const coveredSystemsCount = new Set(
    rows.map((r) => String(r.system_code || "")).filter(Boolean)
  ).size;

  return (
    <AppShell>
      <PageHeader
        title="لوحة الأصول"
        subtitle="عرض الأصول، البحث والتصفية، والطباعة الجماعية لملصقات QR"
      />

      <div className="stats-grid">
        <StatCard
          label="إجمالي الأصول"
          value={totalAssets}
          hint="كل الأصول المسجلة في العميل"
          icon={Boxes}
          tone="teal"
        />
        <StatCard
          label="عليها مخالفات مفتوحة"
          value={assetsWithOpenFindings}
          hint="أصول تحتاج متابعة"
          icon={AlertTriangle}
          tone={assetsWithOpenFindings > 0 ? "red" : "slate"}
        />
        <StatCard
          label="بلا أدلة"
          value={assetsWithoutEvidence}
          hint="لا توجد صور أو مرفقات مرتبطة"
          icon={FileImage}
          tone={assetsWithoutEvidence > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="الأنظمة المغطاة"
          value={coveredSystemsCount}
          hint="عدد أنواع الأنظمة داخل الأصول"
          icon={Wrench}
          tone="slate"
        />
      </div>

      <section className="card">
        <div className="section-header-row">
          <div>
            <div className="section-title">لوحة الأصول</div>
            <div className="section-subtitle">
              فتح الأصل، البحث والتصفية، والطباعة الجماعية لملصقات QR
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
