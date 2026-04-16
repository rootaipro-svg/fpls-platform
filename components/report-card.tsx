import Link from "next/link";
import { CardLinkHint } from "@/components/card-link-hint";
import { StatusBadge } from "@/components/status-badge";
import { ReportDecisionBadge } from "@/components/report-decision-badge";

type Props = {
  visit: any;
  facilityName?: string;
  buildingName?: string;
  compliancePercent?: number;
  findingCount?: number;
  ready?: boolean;
};

export function ReportCard({
  visit,
  facilityName = "",
  buildingName = "",
  compliancePercent = 0,
  findingCount = 0,
  ready = false,
}: Props) {
  return (
    <Link href={`/reports/visit/${visit.visit_id}`} className="report-card">
      <div className="report-card-top">
        <div>
          <div className="report-card-title">
            تقرير زيارة {String(visit.visit_type || "inspection")}
          </div>
          <div className="report-card-sub">
            {facilityName}
            {buildingName ? ` · ${buildingName}` : ""}
          </div>
        </div>

        <StatusBadge status={String(visit.visit_status || "planned")} />
      </div>

      <div className="report-card-text">
        تاريخ الزيارة: {String(visit.planned_date || visit.visit_date || "-")}
      </div>

      <div className="report-card-meta">
        <span className="badge">الامتثال: {compliancePercent}%</span>
        <span className="badge">المخالفات: {findingCount}</span>
        <span
          className={`report-card-ready ${
            ready ? "report-card-ready--yes" : "report-card-ready--no"
          }`}
        >
          {ready ? "جاهز للطباعة" : "يحتاج استكمال"}
        </span>
      </div>

      <div style={{ marginTop: "12px" }}>
        <ReportDecisionBadge value={String(visit.summary_result || "pending")} />
      </div>

      <CardLinkHint label="فتح التقرير" />
    </Link>
  );
}
