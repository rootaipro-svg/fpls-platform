import Link from "next/link";
import {
  Building2,
  ClipboardList,
  QrCode,
  ShieldCheck,
  MapPin,
  CalendarDays,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHero, EmptyPanel } from "@/components/admin-page-kit";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

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

function getSystemName(buildingSystem: Row, systemRef?: Row) {
  return (
    text(buildingSystem.system_name_override, "") ||
    text(systemRef?.system_name_ar, "") ||
    text(systemRef?.system_name, "") ||
    text(buildingSystem.system_code, "نظام")
  );
}

function statusLabel(status: unknown) {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "نشط";
  if (value === "inactive") return "غير نشط";
  if (value === "out_of_service") return "خارج الخدمة";
  if (value === "planned") return "مخطط";
  if (value === "completed") return "مكتمل";

  return text(status, "غير محدد");
}

function resultLabel(result: unknown) {
  const value = String(result || "").toLowerCase();

  if (value === "compliant") return "مطابق";
  if (value === "pass_with_remarks") return "مقبول مع ملاحظات";
  if (value === "non_compliant") return "غير مطابق";
  if (value === "pending") return "قيد الفحص";

  return text(result, "لا توجد نتيجة");
}

export default async function BuildingSystemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePermission("facilities", "view");
  const workbookId = await getTenantWorkbookId(actor.tenantId);
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
        <PageHero
          eyebrow="QR النظام"
          title="النظام غير موجود"
          subtitle="قد يكون الرابط غير صحيح أو تم حذف النظام من قاعدة البيانات."
          icon={QrCode}
        />

        <div style={{ marginTop: "14px" }}>
          <EmptyPanel
            title="لم يتم العثور على النظام"
            description="تأكد من أن building_system_id موجود في شيت BUILDING_SYSTEMS."
          />
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
  const systemName = getSystemName(buildingSystem, systemRef);
  const qrUrl =
    text(buildingSystem.qr_url, "") ||
    `https://fpls-platform.vercel.app/systems/${buildingSystem.building_system_id}`;

  const qrLabel =
    text(buildingSystem.qr_label, "") ||
    `${systemName} - ${text(building?.building_name || building?.building_name_ar, "مبنى")}`;

  return (
    <AppShell>
      <PageHero
        eyebrow="صفحة النظام"
        title={systemName}
        subtitle="هذه الصفحة هي الوجهة التي يفتحها QR Code الخاص بالنظام داخل المبنى."
        icon={QrCode}
        pills={[
          text(buildingSystem.system_code, "SYSTEM"),
          statusLabel(buildingSystem.system_status),
        ]}
      />

      <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
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
                width: "52px",
                height: "52px",
                borderRadius: "18px",
                background: "#ecfeff",
                color: "#0f766e",
                border: "1px solid #ccfbf1",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={26} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#64748b",
                }}
              >
                النظام المركب داخل المبنى
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "20px",
                  fontWeight: 950,
                  color: "#0f172a",
                  lineHeight: 1.5,
                }}
              >
                {systemName}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "13px",
                  color: "#64748b",
                  lineHeight: 1.8,
                }}
              >
                رقم النظام: {text(buildingSystem.building_system_id)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "10px",
          }}
        >
          <div className="card" style={{ padding: "14px" }}>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 800 }}>
              المنشأة
            </div>
            <div style={{ marginTop: "6px", fontWeight: 900, color: "#0f172a" }}>
              {text(facility?.facility_name_ar || facility?.facility_name)}
            </div>
          </div>

          <div className="card" style={{ padding: "14px" }}>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 800 }}>
              المبنى
            </div>
            <div style={{ marginTop: "6px", fontWeight: 900, color: "#0f172a" }}>
              {text(building?.building_name_ar || building?.building_name)}
            </div>
          </div>

          <div className="card" style={{ padding: "14px" }}>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 800 }}>
              نوع النظام
            </div>
            <div style={{ marginTop: "6px", fontWeight: 900, color: "#0f172a" }}>
              {text(systemRef?.system_name_ar || systemRef?.system_name)}
            </div>
          </div>

          <div className="card" style={{ padding: "14px" }}>
            <div style={{ color: "#64748b", fontSize: "12px", fontWeight: 800 }}>
              الموقع / نطاق التغطية
            </div>
            <div style={{ marginTop: "6px", fontWeight: 900, color: "#0f172a" }}>
              {text(
                buildingSystem.protection_area || buildingSystem.coverage_scope
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <MapPin size={20} color="#0f766e" />
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>
              بيانات QR للنظام
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "12px",
              fontSize: "13px",
              lineHeight: 1.8,
              color: "#475569",
              overflowWrap: "anywhere",
            }}
          >
            <div>
              <b>Label:</b> {qrLabel}
            </div>
            <div>
              <b>URL:</b> {qrUrl}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "16px" }}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <CalendarDays size={20} color="#0f766e" />
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>
              آخر زيارة
            </div>
          </div>

          {latestVisit ? (
            <div
              style={{
                display: "grid",
                gap: "8px",
                fontSize: "14px",
                color: "#334155",
                lineHeight: 1.8,
              }}
            >
              <div>
                <b>رقم الزيارة:</b> {text(latestVisit.visit_id)}
              </div>
              <div>
                <b>التاريخ:</b>{" "}
                {text(latestVisit.planned_date || latestVisit.visit_date)}
              </div>
              <div>
                <b>الحالة:</b> {statusLabel(latestVisit.visit_status)}
              </div>
              <div>
                <b>النتيجة:</b> {resultLabel(latestVisit.summary_result)}
              </div>

              <Link
                href={`/visits/${latestVisit.visit_id}`}
                className="btn btn-secondary"
                style={{ marginTop: "6px" }}
              >
                عرض آخر زيارة
              </Link>
            </div>
          ) : (
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
              لا توجد زيارات مسجلة لهذا النظام حتى الآن.
            </div>
          )}
        </div>

        <div
          style={{
            position: "sticky",
            bottom: "92px",
            zIndex: 5,
            display: "grid",
            gap: "8px",
          }}
        >
          <Link
            href={`/visits/new?building_system_id=${buildingSystem.building_system_id}`}
            className="btn btn-grow"
          >
            <ClipboardList size={18} />
            بدء فحص جديد لهذا النظام
          </Link>

          <Link href="/facilities" className="btn btn-secondary">
            <Building2 size={18} />
            الرجوع للمنشآت
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
