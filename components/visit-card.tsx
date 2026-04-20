import Link from "next/link";
import { toSummaryResultLabel, toVisitStatusLabel, toVisitTypeLabel } from "@/lib/display";

function getStatusTheme(status: any) {
  const v = String(status || "").toLowerCase();

  if (v === "closed" || v === "completed") {
    return {
      bg: "#ecfdf5",
      color: "#0f766e",
      border: "1px solid #bbf7d0",
    };
  }

  if (v === "in_progress" || v === "inprogress" || v === "open") {
    return {
      bg: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }

  return {
    bg: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
  };
}

type VisitCardProps = {
  visit: any;
  facilityName?: string;
  buildingName?: string;
};

export function VisitCard({
  visit,
  facilityName = "",
  buildingName = "",
}: VisitCardProps) {
  const statusTheme = getStatusTheme(visit.visit_status);

  return (
    <Link
      href={`/visits/${visit.visit_id}`}
      className="card"
      style={{
        display: "block",
        padding: "16px",
        textDecoration: "none",
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
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "17px",
              lineHeight: 1.45,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {toVisitTypeLabel(visit.visit_type)}
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            التاريخ: {String(visit.planned_date || visit.visit_date || "-")}
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: "999px",
            background: statusTheme.bg,
            color: statusTheme.color,
            border: statusTheme.border,
            fontSize: "12px",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {toVisitStatusLabel(visit.visit_status)}
        </span>
      </div>

      <div
        style={{
          marginTop: "10px",
          fontSize: "14px",
          color: "#334155",
          lineHeight: 1.7,
        }}
      >
        {facilityName ? facilityName : "منشأة غير محددة"}
        {buildingName ? ` · ${buildingName}` : ""}
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "13px",
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        {toSummaryResultLabel(visit.summary_result || visit.notes || "pending")}
      </div>

      <div
        style={{
          marginTop: "12px",
          fontSize: "13px",
          fontWeight: 800,
          color: "#0f766e",
        }}
      >
        فتح الزيارة
      </div>
    </Link>
  );
}
