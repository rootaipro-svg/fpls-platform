import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  FileImage,
  ShieldAlert,
  Wrench,
} from "lucide-react";
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
  );
  const assetsWithoutEvidence = rows.filter(
    (r) => !evidenceAssetIds.has(String(r.asset_id))
  );
  const inactiveAssets = rows.filter((r) =>
    ["inactive", "out_of_service", "retired"].includes(
      String(r.status || "").toLowerCase()
    )
  );

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
          value={assetsWithOpenFindings.length}
          hint="أصول تحتاج متابعة"
          icon={AlertTriangle}
          tone={assetsWithOpenFindings.length > 0 ? "red" : "slate"}
        />
        <StatCard
          label="بلا أدلة"
          value={assetsWithoutEvidence.length}
          hint="لا توجد صور أو مرفقات مرتبطة"
          icon={FileImage}
          tone={assetsWithoutEvidence.length > 0 ? "amber" : "slate"}
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
        <>
          <section className="card">
            <div className="section-title">الأصول عالية الأولوية</div>
            <div className="section-subtitle">
              أهم العناصر التي تحتاج انتباهًا سريعًا من الناحية التشغيلية
            </div>

            <div className="stack-3" style={{ marginTop: "14px" }}>
              <div className="card" style={{ background: "#fffaf5" }}>
                <div className="section-header-row">
                  <div>
                    <div className="section-title" style={{ fontSize: "18px" }}>
                      أصول عليها مخالفات مفتوحة
                    </div>
                    <div className="section-subtitle">
                      هذه الأصول مرتبطة بملاحظات أو مخالفات لم يتم إغلاقها بعد
                    </div>
                  </div>
                  <span className="badge">
                    {assetsWithOpenFindings.length}
                  </span>
                </div>

                {assetsWithOpenFindings.length === 0 ? (
                  <div className="muted-note" style={{ marginTop: "12px" }}>
                    لا توجد أصول عليها مخالفات مفتوحة حاليًا.
                  </div>
                ) : (
                  <div className="stack-3" style={{ marginTop: "12px" }}>
                    {assetsWithOpenFindings.slice(0, 5).map((asset) => (
                      <div key={asset.asset_id} className="system-line">
                        <div className="system-line-top">
                          <div>
                            <div className="system-line-title">
                              {asset.asset_name_ar ||
                                asset.asset_name ||
                                asset.asset_code ||
                                asset.asset_id}
                            </div>
                            <div className="system-line-date">
                              {asset.asset_code}
                              {asset.system_code ? ` · ${asset.system_code}` : ""}
                              {asset.facility_name ? ` · ${asset.facility_name}` : ""}
                            </div>
                          </div>

                          <div className="btn-row">
                            <Link
                              href={`/assets/${asset.asset_id}`}
                              className="btn btn-secondary"
                            >
                              فتح الأصل
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ background: "#fffef7" }}>
                <div className="section-header-row">
                  <div>
                    <div className="section-title" style={{ fontSize: "18px" }}>
                      أصول بلا أدلة
                    </div>
                    <div className="section-subtitle">
                      أصول لا يوجد لها صور أو مرفقات مرتبطة حتى الآن
                    </div>
                  </div>
                  <span className="badge">{assetsWithoutEvidence.length}</span>
                </div>

                {assetsWithoutEvidence.length === 0 ? (
                  <div className="muted-note" style={{ marginTop: "12px" }}>
                    جميع الأصول الحالية لديها أدلة أو مرفقات.
                  </div>
                ) : (
                  <div className="stack-3" style={{ marginTop: "12px" }}>
                    {assetsWithoutEvidence.slice(0, 5).map((asset) => (
                      <div key={asset.asset_id} className="system-line">
                        <div className="system-line-top">
                          <div>
                            <div className="system-line-title">
                              {asset.asset_name_ar ||
                                asset.asset_name ||
                                asset.asset_code ||
                                asset.asset_id}
                            </div>
                            <div className="system-line-date">
                              {asset.asset_code}
                              {asset.system_code ? ` · ${asset.system_code}` : ""}
                              {asset.facility_name ? ` · ${asset.facility_name}` : ""}
                            </div>
                          </div>

                          <div className="btn-row">
                            <Link
                              href={`/assets/${asset.asset_id}`}
                              className="btn btn-secondary"
                            >
                              فتح الأصل
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ background: "#f8fafc" }}>
                <div className="section-header-row">
                  <div>
                    <div className="section-title" style={{ fontSize: "18px" }}>
                      أصول غير نشطة أو خارج الخدمة
                    </div>
                    <div className="section-subtitle">
                      لمراجعة حالتها أو تحديث بياناتها التشغيلية
                    </div>
                  </div>
                  <span className="badge">{inactiveAssets.length}</span>
                </div>

                {inactiveAssets.length === 0 ? (
                  <div className="muted-note" style={{ marginTop: "12px" }}>
                    لا توجد أصول غير نشطة حاليًا.
                  </div>
                ) : (
                  <div className="stack-3" style={{ marginTop: "12px" }}>
                    {inactiveAssets.slice(0, 5).map((asset) => (
                      <div key={asset.asset_id} className="system-line">
                        <div className="system-line-top">
                          <div>
                            <div className="system-line-title">
                              {asset.asset_name_ar ||
                                asset.asset_name ||
                                asset.asset_code ||
                                asset.asset_id}
                            </div>
                            <div className="system-line-date">
                              {asset.asset_code}
                              {asset.system_code ? ` · ${asset.system_code}` : ""}
                              {asset.status ? ` · ${asset.status}` : ""}
                            </div>
                          </div>

                          <div className="btn-row">
                            <Link
                              href={`/assets/${asset.asset_id}`}
                              className="btn btn-secondary"
                            >
                              فتح الأصل
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="section-header-row">
              <div>
                <div className="section-title">تشغيل سريع</div>
                <div className="section-subtitle">
                  انتقال مباشر إلى الأصول والمخالفات وملصقات QR
                </div>
              </div>

              <div className="badge-wrap">
                <Link href="/findings" className="badge">
                  المخالفات
                </Link>
                <Link href="/assets/labels" className="badge">
                  ملصقات QR
                </Link>
              </div>
            </div>
          </section>

          <AssetsBrowser rows={rows} />
        </>
      )}
    </AppShell>
  );
}
