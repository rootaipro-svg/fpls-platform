import Link from "next/link";
import { SeverityBadge } from "@/components/severity-badge";
import { FindingStatusBadge } from "@/components/finding-status-badge";
import { CardLinkHint } from "@/components/card-link-hint";

type Props = {
  finding: any;
  facilityName?: string;
  buildingName?: string;
  systemCode?: string;
};

export function FindingCard({
  finding,
  facilityName = "",
  buildingName = "",
  systemCode = "",
}: Props) {
  return (
    <Link href={`/findings/${finding.finding_id}`} className="finding-card">
      <div className="finding-card-top">
        <div>
          <div className="finding-card-title">
            {String(finding.title || "مخالفة")}
          </div>
          <div className="finding-card-code">
            {String(finding.finding_code || finding.finding_id)}
          </div>
        </div>

        <SeverityBadge severity={String(finding.severity || "")} />
      </div>

      <div className="finding-card-text">
        {String(finding.description || "لا يوجد وصف")}
      </div>

      <div className="finding-card-meta">
        <FindingStatusBadge
          status={String(
            finding.closure_status || finding.compliance_status || "open"
          )}
        />
        {facilityName ? <span className="badge">{facilityName}</span> : null}
        {buildingName ? <span className="badge">{buildingName}</span> : null}
        {systemCode ? <span className="badge">{systemCode}</span> : null}
      </div>

      <CardLinkHint label="عرض المخالفة" />
    </Link>
  );
}
