import Link from "next/link";
import { Boxes, Building2, ClipboardList, QrCode, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  ActionCard,
  EmptyPanel,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import { isActiveRecord } from "@/lib/display";

function facilityStatusLabel(value: any) {
  return isActiveRecord(value) ? "نشط" : "غير نشط";
}

export default async function FacilitiesPage() {
  const actor = await requirePermission("facilities", "view");

  const [facilities, buildings, assets, buildingSystems] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
    readSheet(actor.workbookId, "ASSETS"),
    readSheet(actor.workbookId, "BUILDING_SYSTEMS"),
  ]);

  const activeFacilitiesCount = facilities.filter((f: any) =>
    isActiveRecord(f.status || f.facility_status)
  ).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="إدارة المنشآت والمباني والأنظمة المرتبطة بها"
        title="المنشآت"
        subtitle="عرض موحد ومختصر للمنشآت المسجلة داخل النظام"
        icon={Building2}
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
          label="إجمالي المنشآت"
          value={facilities.length}
          hint="كل المنشآت المسجلة"
          icon={Building2}
          tone="teal"
        />
        <MetricCard
          label="المنشآت النشطة"
          value={activeFacilitiesCount}
          hint="المنشآت الجاهزة للتشغيل"
          icon={Building2}
          tone="teal"
        />
        <MetricCard
          label="المباني"
          value={buildings.length}
          hint="إجمالي المباني التابعة"
          icon={ClipboardList}
          tone="slate"
        />
        <MetricCard
          label="الأصول"
          value={assets.length}
          hint="كل الأصول المسجلة"
          icon={Boxes}
          tone="slate"
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="اختصارات سريعة"
          subtitle="انتقال مباشر إلى لوحة الأصول وإدارة ملصقات QR"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <ActionCard href="/assets" title="فتح لوحة الأصول" icon={Boxes} tone="slate" />
            <ActionCard href="/assets/labels" title="ملصقات QR" icon={QrCode} tone="slate" />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="إضافة منشأة"
          subtitle="سجل منشأة جديدة داخل النظام مع بياناتها الأساسية"
        >
          <Link
            href="/facilities/new"
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              textDecoration: "none",
              padding: "18px",
            }}
          >
            <div
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#14b8a6",
                color: "#fff",
                flexShrink: 0,
                fontSize: "34px",
                fontWeight: 900,
              }}
            >
              +
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                إضافة منشأة
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "#64748b",
                }}
              >
                سجل منشأة جديدة داخل النظام مع بياناتها الأساسية
              </div>
            </div>
          </Link>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="قائمة المنشآت"
          subtitle="عرض مختصر وسريع للمنشآت المسجلة"
        >
          {facilities.length === 0 ? (
            <EmptyPanel
              title="لا توجد منشآت"
              description="ابدأ بإضافة أول منشأة داخل النظام."
            />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {facilities.map((facility: any) => {
                const facilityId = String(facility.facility_id || "");
                const facilityBuildings = buildings.filter(
                  (b: any) => String(b.facility_id || "") === facilityId
                );
                const buildingIds = new Set(
                  facilityBuildings.map((b: any) => String(b.building_id || ""))
                );

                const facilityAssets = assets.filter(
                  (a: any) => String(a.facility_id || "") === facilityId
                );

                const facilitySystems = buildingSystems.filter((bs: any) =>
                  buildingIds.has(String(bs.building_id || ""))
                );

                return (
                  <Link
                    key={facilityId}
                    href={`/facilities/${facilityId}`}
                    className="card"
                    style={{
                      display: "block",
                      textDecoration: "none",
                      padding: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "22px",
                            lineHeight: 1.25,
                            fontWeight: 900,
                            color: "#0f172a",
                          }}
                        >
                          {String(
                            facility.facility_name_ar ||
                              facility.facility_name ||
                              "منشأة بدون اسم"
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "14px",
                            color: "#64748b",
                            lineHeight: 1.7,
                          }}
                        >
                          {String(facility.city || "-")}
                          {facility.occupancy_type ? ` · ${String(facility.occupancy_type)}` : ""}
                        </div>

                        {facility.address ? (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "14px",
                              color: "#64748b",
                              lineHeight: 1.7,
                            }}
                          >
                            {String(facility.address)}
                          </div>
                        ) : null}
                      </div>

                      <SoftBadge
                        label={facilityStatusLabel(facility.status || facility.facility_status)}
                        tone={isActiveRecord(facility.status || facility.facility_status) ? "teal" : "slate"}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: "10px",
                        marginTop: "14px",
                      }}
                    >
                      <div
                        style={{
                          borderRadius: "16px",
                          background: "#f8fafc",
                          border: "1px solid #eef2f7",
                          padding: "12px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "14px", color: "#64748b" }}>المباني</div>
                        <div style={{ marginTop: "6px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
                          {facilityBuildings.length}
                        </div>
                      </div>

                      <div
                        style={{
                          borderRadius: "16px",
                          background: "#f8fafc",
                          border: "1px solid #eef2f7",
                          padding: "12px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "14px", color: "#64748b" }}>الأنظمة</div>
                        <div style={{ marginTop: "6px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
                          {facilitySystems.length}
                        </div>
                      </div>

                      <div
                        style={{
                          borderRadius: "16px",
                          background: "#f8fafc",
                          border: "1px solid #eef2f7",
                          padding: "12px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "14px", color: "#64748b" }}>الأصول</div>
                        <div style={{ marginTop: "6px", fontSize: "30px", fontWeight: 900, color: "#0f172a" }}>
                          {facilityAssets.length}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "14px",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "#0f766e",
                      }}
                    >
                      عرض المنشأة
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
