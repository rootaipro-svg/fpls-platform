import Link from "next/link";
import { toVisitTypeLabel } from "@/lib/display";
import { StatusBadge } from "@/components/status-badge";
import { CardLinkHint } from "@/components/card-link-hint";

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
  return (
    <Link href={`/visits/${visit.visit_id}`} className="visit-card">
      <div className="visit-card-top">
        <div>
          <div className="visit-card-title">
            {toVisitTypeLabel(visit.visit_type)}
          </div>
          <div className="visit-card-sub">
            {String(visit.planned_date || visit.visit_date || "-")}
          </div>
        </div>

        <StatusBadge status={String(visit.visit_status || "planned")} />
      </div>

      <div className="visit-card-text">
        {facilityName ? facilityName : "منشأة غير محددة"}
        {buildingName ? ` · ${buildingName}` : ""}
      </div>

      <div className="visit-card-sub" style={{ marginTop: "8px" }}>
        {String(visit.summary_result || visit.notes || "لا توجد ملاحظات")}
      </div>

      <CardLinkHint label="فتح الزيارة" />
    </Link>
  );
}
