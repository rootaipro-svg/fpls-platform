import Link from "next/link";
import { SeverityBadge } from "@/components/severity-badge";

function getFindingStatusMeta(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "closed") {
    return {
      className: "finding-status-pill finding-status-pill--closed",
      label: "مغلقة",
    };
  }

  if (normalized === "verifying") {
    return {
      className: "finding-status-pill finding-status-pill--verifying",
      label: "قيد التحقق",
    };
  }

  if (normalized === "open") {
    return {
      className: "finding-status-pill finding-status-pill--open",
      label: "مفتوحة",
    };
  }

  return {
    className: "finding-status-pill finding-status-pill--default",
    label: status || "غير محدد",
  };
}

type Props = {
  finding: any;
  systemCode?: string;
  facilityName?: string;
  buildingName?: string;
};

export function FindingCard({
  finding,
  systemCode = "",
  facilityName = "",
  buildingName = "",
}: Props) {
  const statusMeta = getFindingStatusMeta(
    String(finding.closure_status || finding.compliance_status || "open")
  );

  return (
    <Link href={`/findings/${finding.finding_id}`} className="finding-card">
      <div className="finding-card-top">
        <div>
          <div className="finding-card-title">
            {String(finding.title || "مخالفة")}
          </div>
          <div className="finding-card-code">
            {String(finding.finding_code || finding.finding_id || "")}
          </div>
        </div>

        <span className={statusMeta.className}>{statusMeta.label}</span>
      </div>

      <div className="finding-card-desc">
        {String(finding.description || "لا يوجد وصف")}
      </div>

      <div className="finding-card-meta">
        {facilityName ? facilityName : "منشأة غير محددة"}
        {buildingName ? ` · ${buildingName}` : ""}
        {systemCode ? ` · ${systemCode}` : ""}
      </div>

      <div className="finding-badges">
        <SeverityBadge severity={String(finding.severity || "")} />
      </div>
    </Link>
  );
}
