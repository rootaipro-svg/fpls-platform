export function ReportDecisionBadge({ value }: { value: string }) {
  const normalized = String(value || "").toLowerCase();

  let className = "report-decision-badge report-decision-badge--neutral";
  let label = value || "غير محدد";

  if (normalized === "compliant") {
    className = "report-decision-badge report-decision-badge--ok";
    label = "الحكم الفني: مطابق";
  } else if (normalized === "pass_with_remarks") {
    className = "report-decision-badge report-decision-badge--warn";
    label = "الحكم الفني: مطابق مع ملاحظات";
  } else if (normalized === "fail_critical") {
    className = "report-decision-badge report-decision-badge--danger";
    label = "الحكم الفني: غير مطابق - حرج";
  } else if (normalized === "pending") {
    className = "report-decision-badge report-decision-badge--neutral";
    label = "الحكم الفني: قيد الانتظار";
  }

  return <span className={className}>{label}</span>;
}
