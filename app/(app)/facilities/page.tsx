import Link from "next/link";
import {
  Boxes,
  Building2,
  ChevronLeft,
  MapPin,
  PlusCircle,
  QrCode,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import AddFacilityForm from "@/components/add-facility-form";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

function formatDate(value: any) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return raw;
  return dt.toISOString().slice(0, 10);
}

function toFacilityTypeLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    office: "مكاتب (Office)",
    healthcare: "صحي (Healthcare)",
    hospital: "مستشفى (Hospital)",
    residential: "سكني (Residential)",
    commercial: "تجاري (Commercial)",
    industrial: "صناعي (Industrial)",
    warehouse: "مستودع (Warehouse)",
    mixed_use: "متعدد الاستخدام (Mixed Use)",
    education: "تعليمي (Education)",
    hotel: "فندقي (Hotel)",
  };

  return map[v] || String(value || "غير محدد");
}

function toFacilityStatusLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  if (!v || v === "active") return "نشط";
  if (v === "inactive") return "غير نشط";
  if (v === "draft") return "مسودة";

  return String(value || "نشط");
}

function statusTone(value: any): "teal" | "slate" | "amber" {
  const v = String(value || "").trim().toLowerCase();
  if (!v || v === "active") return "teal";
  if (v === "draft") return "amber";
  return "slate";
}

function toneStyle(tone: "teal" | "slate" | "amber") {
  if (tone === "teal") {
    return {
      bg: "#ecfeff",
      text: "#0f766e",
      border: "#ccfbf1",
    };
  }

  if (tone === "amber") {
    return {
      bg: "#fffbeb",
      text: "#b45309",
      border: "#fde68a",
    };
  }

  return {
    bg: "#f8fafc",
    text: "#475569",
    border: "#e2e8f0",
  };
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "14px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {subtitle ? (
          <div
            style={{
              marginTop: "6px",
              fontSize: "15px",
              color: "#64748b",
              lineHeight: 1.8,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}

function TinyMetricCard({
  value,
  label,
  icon: Icon,
}: {
  value: number | string;
  label: string;
  icon: any;
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        background: "#fff",
        padding: "16px",
        minHeight: "108px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "18px",
          background: "#ecfeff",
          border: "1px solid #ccfbf1",
          color: "#0f766e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={24} />
      </div>

      <div style={{ textAlign: "right", flex: 1 }}>
        <div
          style={{
            fontSize: "16px",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: "2px",
            fontSize: "40px",
            fontWeight: 900,
            color: "#0f172a",
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ActionTile({
  href,
  title,
  icon: Icon,
}: {
  href: string;
  title: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        minHeight: "104px",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        padding: "14px",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: "46px",
          height: "46px",
          borderRadius: "16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          color: "#475569",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={21} />
      </div>

      <div
        style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "#0f172a",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {title}
      </div>
    </Link>
  );
}

function FacilityRow({
  facility,
  buildingCount,
  systemCount,
}: {
  facility: any;
  buildingCount: number;
  systemCount: number;
}) {
  const tone = statusTone(facility.status);
  const palette = toneStyle(tone);

  const facilityName = String(
    facility.facility_name_ar ||
      facility.facility_name ||
      facility.name ||
      facility.facility_code ||
      "منشأة"
  );

  const address =
    String(facility.city || "").trim() ||
    String(facility.region || "").trim() ||
    String(facility.location || "").trim() ||
    String(facility.address_line || "").trim();

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "28px",
        background: "#fff",
        padding: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 14px",
            borderRadius: "999px",
            border: `1px solid ${palette.border}`,
            background: palette.bg,
            color: palette.text,
            fontSize: "14px",
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {toFacilityStatusLabel(facility.status)}
        </span>

        <div style={{ flex: 1, textAlign: "right" }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.4,
            }}
          >
            {facilityName}
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "15px",
              color: "#64748b",
              lineHeight: 1.8,
            }}
          >
            {toFacilityTypeLabel(facility.facility_type || facility.occupancy_type)}
          </div>

          {address ? (
            <div
              style={{
                marginTop: "6px",
                fontSize: "15px",
                color: "#64748b",
                lineHeight: 1.8,
                display: "flex",
                gap: "8px",
                alignItems: "center",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <span>{address}</span>
              <MapPin size={15} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
        }}
      >
        <div
          style={{
            borderRadius: "22px",
            background: "#f8fafc",
            border: "1px solid #eef2f7",
            padding: "16px",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              color: "#64748b",
            }}
          >
            المباني
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "34px",
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.2,
            }}
          >
            {buildingCount}
          </div>
        </div>

        <div
          style={{
            borderRadius: "22px",
            background: "#f8fafc",
            border: "1px solid #eef2f7",
            padding: "16px",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              color: "#64748b",
            }}
          >
            الأنظمة
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "34px",
              fontWeight: 900,
              color: "#0f172a",
              lineHeight: 1.2,
            }}
          >
            {systemCount}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px dashed #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <Link
          href={`/facilities/${String(facility.facility_id || "")}`}
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#0f766e",
            textDecoration: "none",
          }}
        >
          عرض المنشأة
        </Link>

        <Link
          href={`/facilities/${String(facility.facility_id || "")}`}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            border: "1px solid #ccfbf1",
            background: "#ecfeff",
            color: "#0f766e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={22} />
        </Link>
      </div>
    </div>
  );
}

export default async function FacilitiesPage() {
  const actor = await requirePermission("facilities", "view");

  const [facilities, buildings, systems] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
    readSheet(actor.workbookId, "BUILDING_SYSTEMS"),
  ]);

  const activeFacilitiesCount = facilities.filter((facility: any) => {
    const status = String(facility.status || "active").toLowerCase();
    return status !== "inactive";
  }).length;

  return (
    <AppShell>
      <section
        className="card"
        style={{
          marginBottom: "18px",
        }}
      >
        <SectionHeader
          title="المنشآت"
          subtitle="إدارة المنشآت والمباني والأنظمة المرتبطة بها"
        />
      </section>

      <section className="card" style={{ marginBottom: "18px" }}>
        <SectionHeader
          title="اختصارات سريعة"
          subtitle="انتقال مباشر إلى لوحة الأصول وإدارة ملصقات QR"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <ActionTile href="/assets" title="فتح لوحة الأصول" icon={Boxes} />
          <ActionTile href="/assets/labels" title="ملصقات QR" icon={QrCode} />
        </div>
      </section>

      <section className="card" style={{ marginBottom: "18px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <TinyMetricCard
            value={facilities.length}
            label="إجمالي المنشآت"
            icon={Building2}
          />
          <TinyMetricCard
            value={activeFacilitiesCount}
            label="المنشآت النشطة"
            icon={Building2}
          />
        </div>
      </section>

      <section className="card" style={{ marginBottom: "18px" }}>
        <SectionHeader
          title="إضافة منشأة"
          subtitle="سجل منشأة جديدة داخل النظام مع بياناتها الأساسية"
          action={
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "#0f9f96",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <PlusCircle size={26} />
            </div>
          }
        />

        <AddFacilityForm />
      </section>

      <section className="card">
        <SectionHeader
          title="قائمة المنشآت"
          subtitle="عرض موحد ومختصر للمنشآت المسجلة داخل النظام"
        />

        {facilities.length === 0 ? (
          <EmptyState
            title="لا توجد منشآت"
            description="ابدأ بإضافة أول منشأة لتكوين قاعدة البيانات التشغيلية."
            icon={Building2}
          />
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {facilities.map((facility: any) => {
              const facilityBuildings = buildings.filter(
                (b: any) =>
                  String(b.facility_id || "") === String(facility.facility_id || "")
              );

              const buildingIds = new Set(
                facilityBuildings.map((b: any) => String(b.building_id || ""))
              );

              const facilitySystems = systems.filter((s: any) =>
                buildingIds.has(String(s.building_id || ""))
              );

              return (
                <FacilityRow
                  key={String(facility.facility_id || "")}
                  facility={facility}
                  buildingCount={facilityBuildings.length}
                  systemCount={facilitySystems.length}
                />
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
