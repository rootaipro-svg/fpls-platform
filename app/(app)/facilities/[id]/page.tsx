import Link from "next/link";
import {
  Boxes,
  Building2,
  ClipboardList,
  MapPin,
  QrCode,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  ActionCard,
  EmptyPanel,
  ListRow,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import {
  safeText,
  toFacilityTypeLabel,
  toSystemLabel,
  toVisitStatusLabel,
  toVisitTypeLabel,
  isOpenFindingStatus,
  isActiveRecord,
} from "@/lib/display";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("facilities", "view");

  const [facilities, buildings, buildingSystems, assets, visits, findings] =
    await Promise.all([
      readSheet(actor.workbookId, "FACILITIES"),
      readSheet(actor.workbookId, "BUILDINGS"),
      readSheet(actor.workbookId, "BUILDING_SYSTEMS"),
      readSheet(actor.workbookId, "ASSETS"),
      readSheet(actor.workbookId, "VISITS"),
      readSheet(actor.workbookId, "FINDINGS"),
    ]);

  const facility = facilities.find(
    (row: any) => String(row.facility_id || "") === String(id)
  );

  if (!facility) {
    return (
      <AppShell>
        <SectionCard title="تفاصيل المنشأة" subtitle="تعذر العثور على المنشأة المطلوبة">
          <EmptyPanel
            title="المنشأة غير موجودة"
            description="قد يكون الرابط غير صحيح أو تم حذف المنشأة."
          />
        </SectionCard>
      </AppShell>
    );
  }

  const facilityBuildings = buildings.filter(
    (row: any) => String(row.facility_id || "") === String(id)
  );

  const buildingIds = new Set(
    facilityBuildings.map((row: any) => String(row.building_id || ""))
  );

  const facilitySystems = buildingSystems.filter((row: any) =>
    buildingIds.has(String(row.building_id || ""))
  );

  const facilityAssets = assets.filter(
    (row: any) => String(row.facility_id || "") === String(id)
  );

  const facilityVisits = sortByDateDesc(
    visits.filter((row: any) => String(row.facility_id || "") === String(id)),
    "planned_date"
  );

  const openFindingsCount = findings.filter((row: any) =>
    isOpenFindingStatus(row.closure_status || row.compliance_status || "")
  ).length;

  const activeBuildingsCount = facilityBuildings.filter((row: any) =>
    isActiveRecord(row.status || row.building_status)
  ).length;

  const systemCodes = Array.from(
    new Set(
      facilityAssets
        .map((row: any) => String(row.system_code || "").trim())
        .filter(Boolean)
    )
  );

  return (
    <AppShell>
      <PageHero
        eyebrow="ملف المنشأة والمباني والأنظمة والأصول المرتبطة بها"
        title={safeText(
          facility.facility_name_ar || facility.facility_name,
          "منشأة"
        )}
        subtitle={`${safeText(facility.city, "-")}${
          facility.district ? ` · ${String(facility.district)}` : ""
        }${facility.address ? ` · ${String(facility.address)}` : ""}`}
        icon={Building2}
        pills={[
          toFacilityTypeLabel(facility.facility_type || facility.occupancy_type),
          isActiveRecord(facility.status || facility.facility_status)
            ? "نشطة"
            : "غير نشطة",
        ]}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginTop: "14px",
        }}
      >
        <MetricCard
          label="المباني"
          value={facilityBuildings.length}
          hint="إجمالي المباني التابعة"
          icon={Building2}
          tone="teal"
        />
        <MetricCard
          label="الأنظمة"
          value={facilitySystems.length}
          hint="الأنظمة المثبتة"
          icon={Wrench}
          tone="slate"
        />
        <MetricCard
          label="الأصول"
          value={facilityAssets.length}
          hint="كل الأصول المسجلة"
          icon={Boxes}
          tone="slate"
        />
        <MetricCard
          label="الزيارات"
          value={facilityVisits.length}
          hint="الزيارات المرتبطة"
          icon={ClipboardList}
          tone="amber"
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="إجراءات سريعة"
          subtitle="أهم الإجراءات الخاصة بهذه المنشأة"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <ActionCard
              href={`/visits/new?facility_id=${encodeURIComponent(String(id))}`}
              title="زيارة جديدة"
              icon={ClipboardList}
              tone="teal"
            />
            <ActionCard
              href={`/assets?facility_id=${encodeURIComponent(String(id))}`}
              title="أصول المنشأة"
              icon={Boxes}
              tone="slate"
            />
            <ActionCard
              href="/assets/labels"
              title="ملصقات QR"
              icon={QrCode}
              tone="slate"
            />
            <ActionCard
              href="/findings"
              title="المخالفات"
              icon={ShieldAlert}
              tone={openFindingsCount > 0 ? "red" : "slate"}
            />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="ملخص سريع"
          subtitle="معلومات أساسية مهمة عن المنشأة"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>المدينة</div>
              <div style={{ marginTop: "6px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {safeText(facility.city, "-")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الحي / المنطقة</div>
              <div style={{ marginTop: "6px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {safeText(facility.district || facility.region, "-")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>نوع المنشأة</div>
              <div style={{ marginTop: "6px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {toFacilityTypeLabel(facility.facility_type || facility.occupancy_type)}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الحالة</div>
              <div style={{ marginTop: "6px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {isActiveRecord(facility.status || facility.facility_status)
                  ? "نشطة"
                  : "غير نشطة"}
              </div>
            </div>
          </div>

          {facility.address ? (
            <div
              className="card"
              style={{
                padding: "14px",
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <MapPin size={18} color="#64748b" />
              <div style={{ fontSize: "14px", color: "#334155", lineHeight: 1.7 }}>
                {String(facility.address)}
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="الأنظمة الموجودة"
          subtitle="الأنظمة المستنتجة من الأصول المسجلة داخل المنشأة"
        >
          {systemCodes.length === 0 ? (
            <EmptyPanel
              title="لا توجد أنظمة مسجلة"
              description="أضف أصولًا داخل المنشأة ليتم عرض الأنظمة هنا."
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {systemCodes.map((code) => (
                <SoftBadge key={code} label={toSystemLabel(code)} tone="slate" />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="المباني التابعة"
          subtitle="المباني المرتبطة بهذه المنشأة"
        >
          {facilityBuildings.length === 0 ? (
            <EmptyPanel
              title="لا توجد مبانٍ"
              description="أضف مبنى جديدًا للمنشأة لعرضه هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {facilityBuildings.map((building: any) => (
                <div key={String(building.building_id || "")} className="card" style={{ padding: "14px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.5,
                        }}
                      >
                        {safeText(building.building_name, "مبنى")}
                      </div>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "13px",
                          color: "#64748b",
                          lineHeight: 1.7,
                        }}
                      >
                        {safeText(building.building_code || building.building_id, "-")}
                      </div>
                    </div>

                    <SoftBadge
                      label={
                        isActiveRecord(building.status || building.building_status)
                          ? "نشط"
                          : "غير نشط"
                      }
                      tone={
                        isActiveRecord(building.status || building.building_status)
                          ? "teal"
                          : "slate"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="أصول المنشأة"
          subtitle="آخر الأصول المضافة أو المسجلة"
        >
          {facilityAssets.length === 0 ? (
            <EmptyPanel
              title="لا توجد أصول"
              description="أضف أصلًا جديدًا داخل هذه المنشأة لعرضه هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {facilityAssets.slice(0, 8).map((asset: any) => (
                <ListRow
                  key={String(asset.asset_id || "")}
                  href={`/assets/${String(asset.asset_id || "")}`}
                  title={safeText(
                    asset.asset_name_ar || asset.asset_name,
                    "أصل"
                  )}
                  subtitle={`${toSystemLabel(asset.system_code)} · ${safeText(
                    asset.location_note,
                    "بدون موقع محدد"
                  )}`}
                  rightBadge={
                    <SoftBadge
                      label={safeText(asset.asset_code || asset.asset_id, "-")}
                      tone="slate"
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="آخر الزيارات"
          subtitle="أحدث الزيارات المرتبطة بهذه المنشأة"
        >
          {facilityVisits.length === 0 ? (
            <EmptyPanel
              title="لا توجد زيارات"
              description="عند إنشاء زيارة جديدة للمنشأة ستظهر هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {facilityVisits.slice(0, 6).map((visit: any) => (
                <ListRow
                  key={String(visit.visit_id || "")}
                  href={`/visits/${String(visit.visit_id || "")}`}
                  title={toVisitTypeLabel(visit.visit_type)}
                  subtitle={`التاريخ: ${String(
                    visit.planned_date || visit.visit_date || "-"
                  )}`}
                  rightBadge={
                    <SoftBadge
                      label={toVisitStatusLabel(visit.visit_status)}
                      tone={
                        String(visit.visit_status || "").toLowerCase() === "closed" ||
                        String(visit.visit_status || "").toLowerCase() === "completed"
                          ? "teal"
                          : "slate"
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="مؤشرات إضافية"
          subtitle="قراءة سريعة للحالة التشغيلية داخل المنشأة"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            <div className="card" style={{ padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>المباني النشطة</div>
              <div style={{ marginTop: "6px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
                {activeBuildingsCount}
              </div>
            </div>

            <div className="card" style={{ padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>المخالفات المفتوحة</div>
              <div style={{ marginTop: "6px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
                {openFindingsCount}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
