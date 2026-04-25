import Link from "next/link";
import type { CSSProperties } from "react";
import QRCode from "qrcode";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  MapPin,
  QrCode,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  EmptyPanel,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import SystemQrTools from "@/components/system-qr-tools";

import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";
import { safeText, toSystemLabel } from "@/lib/display";

type Row = Record<string, any>;

function text(value: unknown, fallback = "—") {
  const output = String(value ?? "").trim();
  return output || fallback;
}

async function safeReadSheet(workbookId: string, sheetName: string) {
  try {
    return await readSheet(workbookId, sheetName);
  } catch {
    return [];
  }
}

function same(a: unknown, b: unknown) {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

function normalizeUrl(value: unknown, buildingSystemId: string) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://fpls-platform.vercel.app"
  ).replace(/\/$/, "");

  const raw = String(value || "").trim();

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `${appUrl}${raw}`;
  }

  if (raw.includes(".") && !raw.includes(" ")) {
    return `https://${raw}`;
  }

  return `${appUrl}/systems/${buildingSystemId}`;
}

function getSystemLabels(buildingSystem: Row, systemRef?: Row) {
  const code = text(buildingSystem.system_code, "");

  const ar =
    text(buildingSystem.system_name_override, "") ||
    text(systemRef?.system_name_ar, "") ||
    text(systemRef?.system_display_name_ar, "") ||
    text(systemRef?.system_name, "") ||
    toSystemLabel(code);

  const en =
    text(systemRef?.system_name, "") ||
    text(systemRef?.system_display_name, "");

  const standard =
    text(systemRef?.related_standard, "") ||
    text(buildingSystem.standard_profile, "");

  return {
    ar: ar || "نظام",
    en,
    code,
    standard,
  };
}

function statusLabel(status: unknown) {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "نشط";
  if (value === "inactive") return "غير نشط";
  if (value === "out_of_service") return "خارج الخدمة";
  if (value === "planned") return "مجدولة";
  if (value === "in_progress") return "قيد التنفيذ";
  if (value === "completed") return "مكتملة";
  if (value === "closed") return "مغلقة";

  return text(status, "غير محدد");
}

function statusTone(status: unknown) {
  const value = String(status || "").toLowerCase();

  if (value === "active" || value === "closed" || value === "completed") {
    return "teal" as const;
  }

  if (value === "out_of_service" || value === "non_compliant") {
    return "red" as const;
  }

  if (value === "planned" || value === "in_progress") {
    return "amber" as const;
  }

  return "slate" as const;
}

function resultLabel(result: unknown) {
  const value = String(result || "").toLowerCase();

  if (value === "compliant") return "مطابق";
  if (value === "pass_with_remarks") return "مقبول مع ملاحظات";
  if (value === "non_compliant") return "غير مطابق";
  if (value === "critical_findings") return "مخالفات حرجة";
  if (value === "pending") return "قيد الفحص";

  return text(result, "لا توجد نتيجة");
}

function cardGridStyle(): CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  };
}

function infoCardStyle(): CSSProperties {
  return {
    padding: "14px",
    minHeight: "92px",
  };
}

async function makeQrDataUrl(qrUrl: string) {
  try {
    return await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 520,
    });
  } catch {
    return "";
  }
}

export default async function BuildingSystemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePermission("facilities", "view");
  const workbookId =
    actor.workbookId || (await getTenantWorkbookId(actor.tenantId));

  const { id } = await params;

  const [
    buildingSystems,
    buildings,
    facilities,
    systemsRef,
    visits,
    visitSystems,
  ] = await Promise.all([
    safeReadSheet(workbookId, "BUILDING_SYSTEMS"),
    safeReadSheet(workbookId, "BUILDINGS"),
    safeReadSheet(workbookId, "FACILITIES"),
    safeReadSheet(workbookId, "SYSTEMS_REF"),
    safeReadSheet(workbookId, "VISITS"),
    safeReadSheet(workbookId, "VISIT_SYSTEMS"),
  ]);

  const buildingSystem = buildingSystems.find((row: Row) =>
    same(row.building_system_id, id)
  );

  if (!buildingSystem) {
    return (
      <AppShell>
        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="صفحة النظام"
            subtitle="تعذر العثور على النظام المطلوب"
          >
            <EmptyPanel
              title="النظام غير موجود"
              description="قد يكون الرابط غير صحيح أو تم حذف النظام."
            />
          </SectionCard>
        </div>
      </AppShell>
    );
  }

  const building = buildings.find((row: Row) =>
    same(row.building_id, buildingSystem.building_id)
  );

  const facility = facilities.find((row: Row) =>
    same(row.facility_id, building?.facility_id)
  );

  const systemRef = systemsRef.find((row: Row) =>
    same(row.system_code, buildingSystem.system_code)
  );

  const relatedVisitSystems = visitSystems.filter((row: Row) =>
    same(row.building_system_id, buildingSystem.building_system_id)
  );

  const relatedVisitIds = new Set(
    relatedVisitSystems.map((row: Row) => String(row.visit_id || ""))
  );

  const relatedVisits = visits
    .filter((row: Row) => relatedVisitIds.has(String(row.visit_id || "")))
    .sort((a: Row, b: Row) => {
      const ad = String(a.planned_date || a.visit_date || a.created_at || "");
      const bd = String(b.planned_date || b.visit_date || b.created_at || "");
      return bd.localeCompare(ad);
    });

  const latestVisit = relatedVisits[0];

  const labels = getSystemLabels(buildingSystem, systemRef);

  const facilityName = text(
    facility?.facility_name_ar || facility?.facility_name,
    "منشأة غير محددة"
  );

  const buildingName = text(
    building?.building_name_ar || building?.building_name,
    "مبنى غير محدد"
  );

  const locationText = text(
    buildingSystem.protection_area || buildingSystem.coverage_scope,
    "غير محدد"
  );

  const qrUrl = normalizeUrl(
    buildingSystem.qr_url,
    String(buildingSystem.building_system_id || id)
  );

  const qrLabel =
    text(buildingSystem.qr_label, "") ||
    `${labels.ar} - ${buildingName}`;

  const qrDataUrl = await makeQrDataUrl(qrUrl);

  return (
    <AppShell>
      <PageHero
        eyebrow="صفحة نظام / QR"
        title={labels.ar}
        subtitle={[labels.en, labels.code, labels.standard]
          .filter(Boolean)
          .join(" · ")}
        icon={QrCode}
        pills={[
          statusLabel(buildingSystem.system_status || "active"),
          labels.code || "System",
        ]}
      />

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="ملصق QR للنظام"
          subtitle="امسح الكود لفتح هذا النظام مباشرة وبدء الفحص"
        >
          <div
            className="card"
            style={{
              padding: "16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "14px",
                justifyItems: "center",
                textAlign: "center",
              }}
            >
              {qrDataUrl ? (
                <div
                  style={{
                    width: "230px",
                    height: "230px",
                    padding: "12px",
                    borderRadius: "24px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 14px 32px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: "18px",
                    padding: "18px",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  تعذر توليد QR لهذا الرابط.
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 950,
                    color: "#0f172a",
                    lineHeight: 1.5,
                  }}
                >
                  {labels.ar}
                </div>

                {labels.en ? (
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "13px",
                      color: "#64748b",
                      lineHeight: 1.6,
                    }}
                  >
                    {labels.en}
                  </div>
                ) : null}

                <div
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  {labels.code ? (
                    <SoftBadge label={labels.code} tone="slate" />
                  ) : null}

                  {labels.standard ? (
                    <SoftBadge label={labels.standard} tone="teal" />
                  ) : null}
                </div>
              </div>
            </div>

            <SystemQrTools
              qrUrl={qrUrl}
              qrDataUrl={qrDataUrl}
              label={qrLabel}
              arName={labels.ar}
              enName={labels.en}
              code={labels.code}
              standard={labels.standard}
              facilityName={facilityName}
              buildingName={buildingName}
              locationText={locationText}
            />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <Link
          href={`/visits/new?building_system_id=${encodeURIComponent(
            String(buildingSystem.building_system_id || "")
          )}`}
          className="btn btn-grow"
          style={{
            minHeight: "54px",
            fontSize: "16px",
            justifyContent: "center",
          }}
        >
          <ClipboardList size={20} />
          بدء فحص جديد لهذا النظام
        </Link>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="بطاقة هوية النظام"
          subtitle="الموقع والبيانات الأساسية للنظام داخل المنشأة"
        >
          <div className="card" style={{ padding: "14px", marginBottom: "10px" }}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "20px",
                  background: "#ecfeff",
                  border: "1px solid #ccfbf1",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={28} color="#0f766e" />
              </div>

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    fontWeight: 800,
                  }}
                >
                  النظام المركب داخل المبنى
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "18px",
                    fontWeight: 950,
                    color: "#0f172a",
                    lineHeight: 1.5,
                  }}
                >
                  {labels.ar}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#64748b",
                    lineHeight: 1.5,
                  }}
                >
                  رقم النظام: {text(buildingSystem.building_system_id)}
                </div>
              </div>
            </div>
          </div>

          <div style={cardGridStyle()}>
            <div className="card" style={infoCardStyle()}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>المنشأة</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {facilityName}
              </div>
            </div>

            <div className="card" style={infoCardStyle()}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>المبنى</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {buildingName}
              </div>
            </div>

            <div className="card" style={infoCardStyle()}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>نوع النظام</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "15px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {labels.en || labels.ar}
              </div>
            </div>

            <div className="card" style={infoCardStyle()}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الحالة</div>
              <div style={{ marginTop: "8px" }}>
                <SoftBadge
                  label={statusLabel(buildingSystem.system_status || "active")}
                  tone={statusTone(buildingSystem.system_status || "active")}
                />
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "14px",
              marginTop: "10px",
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <MapPin size={18} color="#64748b" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                الموقع / نطاق التغطية
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "14px",
                  color: "#334155",
                  fontWeight: 800,
                  lineHeight: 1.8,
                }}
              >
                {locationText}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="آخر زيارة"
          subtitle="أحدث زيارة مرتبطة بهذا النظام"
        >
          {latestVisit ? (
            <div className="card" style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "18px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <CalendarDays size={24} color="#475569" />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 950,
                      color: "#0f172a",
                      lineHeight: 1.5,
                    }}
                  >
                    {text(latestVisit.visit_type, "زيارة")}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "13px",
                      color: "#64748b",
                      lineHeight: 1.8,
                    }}
                  >
                    رقم الزيارة: {text(latestVisit.visit_id)}
                    <br />
                    التاريخ: {text(latestVisit.planned_date || latestVisit.visit_date)}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    <SoftBadge
                      label={statusLabel(latestVisit.visit_status)}
                      tone={statusTone(latestVisit.visit_status)}
                    />

                    <SoftBadge
                      label={resultLabel(latestVisit.summary_result)}
                      tone={statusTone(latestVisit.summary_result)}
                    />
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <Link
                      href={`/visits/${String(latestVisit.visit_id || "")}`}
                      className="btn btn-secondary"
                    >
                      عرض آخر زيارة
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyPanel
              title="لا توجد زيارات"
              description="لم يتم تسجيل زيارة لهذا النظام حتى الآن."
            />
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="بيانات QR والرابط"
          subtitle="معلومات فنية للنسخ والتحقق"
        >
          <div
            className="card"
            style={{
              padding: "14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                lineHeight: 1.9,
                wordBreak: "break-word",
              }}
            >
              <strong>Label:</strong> {qrLabel}
              <br />
              <strong>URL:</strong> {qrUrl}
            </div>
          </div>
        </SectionCard>
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
          marginTop: "14px",
        }}
      >
        <Link
          href={
            facility?.facility_id
              ? `/facilities/${String(facility.facility_id)}`
              : "/facilities"
          }
          className="btn btn-secondary"
          style={{ justifyContent: "center" }}
        >
          <Building2 size={18} />
          الرجوع للمنشأة
        </Link>
      </div>
    </AppShell>
  );
}
