import Link from "next/link";
import { CardLinkHint } from "@/components/card-link-hint";
import { StatusBadge } from "@/components/status-badge";

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
        <span className="badge">{ready ? "جاهز للطباعة" : "غير مكتمل"}</span>
      </div>

      <CardLinkHint label="فتح التقرير" />
    </Link>
  );
}
