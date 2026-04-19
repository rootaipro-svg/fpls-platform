import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { CardLinkHint } from "@/components/card-link-hint";
function toVisitTypeLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    followup: "متابعة (Follow-up)",
    asset_followup: "متابعة أصل (Asset Follow-up)",
    handover: "تسليم واستلام (Handover)",
    safety_inspection: "فحص سلامة (Safety Inspection)",
    periodic_inspection: "تفتيش دوري (Periodic Inspection)",
    initial_survey: "معاينة أولية (Initial Survey)",
    emergency_maintenance: "صيانة طارئة (Emergency Maintenance)",
    quality_audit: "تدقيق جودة (Quality Audit)",
    inspection: "تفتيش (Inspection)",
    audit: "تدقيق (Audit)",
  };

  return map[v] || String(value || "زيارة");
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
        {facilityName ? `${facilityName}` : "منشأة غير محددة"}
        {buildingName ? ` · ${buildingName}` : ""}
      </div>

      <div className="visit-card-sub" style={{ marginTop: "8px" }}>
        {String(visit.summary_result || visit.notes || "لا توجد ملاحظات")}
      </div>

      <CardLinkHint label="فتح الزيارة" />
    </Link>
  );
}
