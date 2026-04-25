import Link from "next/link";
import {
  Building2,
  ClipboardList,
  MapPin,
  Plus,
  QrCode,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  EmptyPanel,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import FacilityStructureManager from "@/components/facility-structure-manager";

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

type Row = Record<string, any>;

function sortByDateDesc(rows: Row[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

function groupSystemsByBuilding(buildings: Row[], systems: Row[]) {
  const map: Record<string, Row[]> = {};

  for (const building of buildings) {
    map[String(building.building_id || "")] = [];
  }

  for (const system of systems) {
    const buildingId = String(system.building_id || "");
    if (!map[buildingId]) map[buildingId] = [];
    map[buildingId].push(system);
  }

  return map;
}

function systemDisplayName(system: Row) {
  return safeText(
    system.system_name_override ||
      system.system_display_name_ar ||
      system.system_display_name ||
      toSystemLabel(system.system_code),
    "نظام"
  );
}

function facilityName(facility: Row) {
  return safeText(
    facility.facility_name_ar || facility.facility_name,
    "منشأة غير محددة"
  );
}

function buildingName(building: Row) {
  return safeText(
    building.building_name_ar || building.building_name,
    "مبنى"
  );
}

function quickCardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: "24px",
    padding: "18px",
    background: "#fff",
    minHeight: "132px",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    textAlign: "center",
    gap: "10px",
    textDecoration: "none",
    color: "#0f172a",
  };
}

function iconBoxStyle(tone: "teal" | "amber" | "red" | "slate" = "teal") {
  const map = {
    teal: {
      bg: "#ecfeff",
      border: "#ccfbf1",
      color: "#0f766e",
    },
    amber: {
      bg: "#fffbeb",
      border: "#fde68a",
      color: "#b45309",
    },
    red: {
      bg: "#fff1f2",
      border: "#fecdd3",
      color: "#be123c",
    },
    slate: {
      bg: "#f8fafc",
      border: "#e2e8f0",
      color: "#475569",
    },
  }[tone];

  return {
    width: "66px",
    height: "66px",
    borderRadius: "22px",
    display: "grid",
    placeItems: "center",
    background: map.bg,
    border: `1px solid ${map.border}`,
    color: map.color,
  } as React.CSSProperties;
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const actor = await requirePermission("facilities", "view");

  const [
    facilities,
    buildings,
    buildingSystems,
    visits,
    visitSystems,
    findings,
  ] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
    readSheet(actor.workbookId, "BUILDING_SYSTEMS"),
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "VISIT_SYSTEMS"),
    readSheet(actor.workbookId, "FINDINGS"),
  ]);

  const facility = facilities.find(
    (row: Row) => String(row.facility_id || "") === String(id)
  );

  if (!facility) {
    return (
      <AppShell>
        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="تفاصيل المنشأة"
            subtitle="تعذر العثور على المنشأة المطلوبة"
          >
            <EmptyPanel
              title="المنشأة غير موجودة"
              description="قد يكون الرابط غير صحيح أو تم حذف المنشأة."
            />
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const facilityBuildings = buildings.filter(
    (row: Row) => String(row.facility_id || "") === String(id)
  );

  const buildingIds = new Set(
    facilityBuildings.map((row: Row) => String(row.building_id || ""))
  );

  const facilitySystems = buildingSystems.filter((row: Row) =>
    buildingIds.has(String(row.building_id || ""))
  );

  const systemsByBuilding = groupSystemsByBuilding(
    facilityBuildings,
    facilitySystems
  );

  const facilityVisits = sortByDateDesc(
    visits.filter((row: Row) => String(row.facility_id || "") === String(id)),
    "planned_date"
  );

  const facilityVisitIds = new Set(
    facilityVisits.map((row: Row) => String(row.visit_id || ""))
  );

  const facilityVisitSystemIds = new Set(
    visitSystems
      .filter((row: Row) => facilityVisitIds.has(String(row.visit_id || "")))
      .map((row: Row) => String(row.visit_system_id || ""))
  );

  const openFindingsCount = findings.filter(
    (row: Row) =>
      facilityVisitSystemIds.has(String(row.visit_system_id || "")) &&
      isOpenFindingStatus(row.closure_status || row.compliance_status || "")
  ).length;

  const activeBuildingsCount = facilityBuildings.filter((row: Row) =>
    isActiveRecord(row.status || row.building_status)
  ).length;

  const activeVisitsCount = facilityVisits.filter((row: Row) => {
    const status = String(row.visit_status || "").toLowerCase();
    return status === "planned" || status === "in_progress" || status === "open";
  }).length;

  const systemCodes = Array.from(
    new Set(
      facilitySystems
        .map((row: Row) => String(row.system_code || "").trim())
        .filter(Boolean)
    )
  );

  const latestVisits = facilityVisits.slice(0, 3);

  return (
    <AppShell>
      <PageHero
        eyebrow="ملف منشأة"
        title={facilityName(facility)}
        subtitle={`${safeText(facility.city, "مدينة غير محددة")} · ${safeText(
          facility.district || facility.region,
          "منطقة غير محددة"
        )}`}
        icon={Building2}
        pills={[
          toFacilityTypeLabel(
            facility.facility_type || facility.occupancy_classification
          ),
          isActiveRecord(facility.active_status || facility.status)
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
        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 800 }}>
            المباني
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "42px",
              fontWeight: 950,
              color: "#0f172a",
            }}
          >
            {activeBuildingsCount}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            مبانٍ نشطة
          </div>
        </div>

        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 800 }}>
            الأنظمة
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "42px",
              fontWeight: 950,
              color: "#0f172a",
            }}
          >
            {facilitySystems.length}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            أنظمة مثبتة
          </div>
        </div>

        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 800 }}>
            الزيارات
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "42px",
              fontWeight: 950,
              color: "#0f172a",
            }}
          >
            {activeVisitsCount}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            زيارات مفتوحة / مجدولة
          </div>
        </div>

        <div className="card" style={{ padding: "18px" }}>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 800 }}>
            المخالفات
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "42px",
              fontWeight: 950,
              color: "#0f172a",
            }}
          >
            {openFindingsCount}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b" }}>
            مفتوحة للمتابعة
          </div>
        </div>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="إجراءات سريعة"
          subtitle="العمليات الأساسية لهذه المنشأة"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <Link href="/visits/new" style={quickCardStyle()}>
              <div style={iconBoxStyle("teal")}>
                <ClipboardList size={30} />
              </div>
              <div style={{ fontSize: "18px", fontWeight: 900 }}>
                زيارة جديدة
              </div>
            </Link>

            <a href="#manage" style={quickCardStyle()}>
              <div style={iconBoxStyle("teal")}>
                <Plus size={30} />
              </div>
              <div style={{ fontSize: "18px", fontWeight: 900 }}>
                إضافة مبنى
              </div>
            </a>

            <a href="#manage" style={quickCardStyle()}>
              <div style={iconBoxStyle("slate")}>
                <Wrench size={30} />
              </div>
              <div style={{ fontSize: "18px", fontWeight: 900 }}>
                إدارة الأنظمة
              </div>
            </a>

            <a href="#systems" style={quickCardStyle()}>
              <div style={iconBoxStyle("amber")}>
                <QrCode size={30} />
              </div>
              <div style={{ fontSize: "18px", fontWeight: 900 }}>
                QR الأنظمة
              </div>
            </a>
          </div>
        </SectionCard>
      </div>

      <div id="buildings" style={{ marginTop: "14px" }}>
        <SectionCard
          title="المباني والأنظمة"
          subtitle="كل مبنى والأنظمة المسجلة داخله"
        >
          {facilityBuildings.length === 0 ? (
            <EmptyPanel
              title="لا توجد مبانٍ"
              description="ابدأ بإضافة مبنى، ثم اختر الأنظمة الموجودة داخله."
            />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {facilityBuildings.map((building: Row) => {
                const buildingId = String(building.building_id || "");
                const systems = systemsByBuilding[buildingId] || [];

                return (
                  <div
                    key={buildingId}
                    className="card"
                    style={{
                      padding: "16px",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: 950,
                            color: "#0f172a",
                            lineHeight: 1.5,
                          }}
                        >
                          {buildingName(building)}
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "13px",
                            color: "#64748b",
                            lineHeight: 1.7,
                          }}
                        >
                          {safeText(building.building_code, "-")} · الأنظمة:{" "}
                          {systems.length}
                        </div>
                      </div>

                      <SoftBadge
                        label={safeText(
                          building.status || building.building_status,
                          "active"
                        )}
                        tone="slate"
                      />
                    </div>

                    {systems.length === 0 ? (
                      <div
                        style={{
                          border: "1px dashed #cbd5e1",
                          borderRadius: "18px",
                          padding: "14px",
                          fontSize: "13px",
                          color: "#64748b",
                          lineHeight: 1.8,
                        }}
                      >
                        لا توجد أنظمة مسجلة لهذا المبنى. استخدم زر إدارة الأنظمة
                        لإضافة الأنظمة الموجودة داخل المبنى.
                      </div>
                    ) : (
                      <div
                        id="systems"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {systems.map((system: Row) => {
                          const href = `/systems/${String(
                            system.building_system_id || ""
                          )}`;

                          return (
                            <Link
                              key={String(system.building_system_id || "")}
                              href={href}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                borderRadius: "999px",
                                border: "1px solid #e2e8f0",
                                background: "#f8fafc",
                                padding: "8px 12px",
                                color: "#334155",
                                textDecoration: "none",
                                fontSize: "13px",
                                fontWeight: 800,
                                lineHeight: 1.5,
                              }}
                            >
                              {systemDisplayName(system)}
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginTop: "2px",
                      }}
                    >
                      <a href="#manage" className="btn btn-secondary">
                        إدارة المبنى والأنظمة
                      </a>

                      <Link href="/visits/new" className="btn btn-secondary">
                        بدء زيارة
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                المدينة
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {safeText(facility.city, "-")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                الحي / المنطقة
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {safeText(facility.district || facility.region, "-")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                نوع المنشأة
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {toFacilityTypeLabel(
                  facility.facility_type || facility.occupancy_classification
                )}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الحالة</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {isActiveRecord(facility.active_status || facility.status)
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
                gap: "8px",
              }}
            >
              <MapPin size={18} color="#64748b" />
              <div
                style={{
                  fontSize: "14px",
                  color: "#334155",
                  lineHeight: 1.8,
                }}
              >
                {String(facility.address)}
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="آخر الزيارات"
          subtitle="آخر ثلاث زيارات فقط لتقليل التشويش"
        >
          {latestVisits.length === 0 ? (
            <EmptyPanel
              title="لا توجد زيارات"
              description="لم يتم تسجيل زيارات لهذه المنشأة بعد."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {latestVisits.map((visit: Row) => (
                <Link
                  key={String(visit.visit_id || "")}
                  href={`/visits/${String(visit.visit_id || "")}`}
                  className="card"
                  style={{
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1.5,
                      }}
                    >
                      {toVisitTypeLabel(visit.visit_type || "routine")}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      التاريخ:{" "}
                      {safeText(visit.planned_date || visit.visit_date, "-")}
                    </div>
                  </div>

                  <SoftBadge
                    label={toVisitStatusLabel(visit.visit_status)}
                    tone={
                      String(visit.visit_status || "").toLowerCase() === "closed"
                        ? "teal"
                        : "slate"
                    }
                  />
                </Link>
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
            <div className="card" style={{ padding: "18px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                المباني النشطة
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "34px",
                  fontWeight: 950,
                  color: "#0f172a",
                }}
              >
                {activeBuildingsCount}
              </div>
            </div>

            <div className="card" style={{ padding: "18px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                المخالفات المفتوحة
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "34px",
                  fontWeight: 950,
                  color: "#0f172a",
                }}
              >
                {openFindingsCount}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div id="manage" style={{ marginTop: "14px" }}>
        <SectionCard
          title="إدارة المنشأة والمباني والأنظمة"
          subtitle="تعديل البيانات، إضافة مبنى، وإدارة الأنظمة المسجلة"
        >
          <FacilityStructureManager
            facility={facility}
            buildings={facilityBuildings}
            systems={facilitySystems}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
