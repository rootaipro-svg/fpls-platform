import { StatusBadge } from "@/components/status-badge";
import { ComplianceProgress } from "@/components/compliance-progress";

function toArabicResult(value: string) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "compliant") return "مطابق";
  if (normalized === "non_compliant") return "غير مطابق";
  if (normalized === "critical_findings") return "ملاحظات حرجة";
  if (normalized === "pending") return "قيد الانتظار";

  return value || "غير محدد";
}

export function VisitSystemSummaryCard({ system }: { system: any }) {
  return (
    <div className="system-summary-card">
      <div className="system-summary-top">
        <div>
          <div className="system-summary-title">
            {String(system.system_code || "System")}
          </div>
          <div className="system-summary-sub">
            النتيجة: {toArabicResult(String(system.result_summary || "pending"))}
          </div>
        </div>

        <StatusBadge status={String(system.status || "planned")} />
      </div>

      <ComplianceProgress value={String(system.compliance_percent || 0)} />

      <div className="system-summary-meta">
        <span className="badge">
          حرج: {String(system.critical_count || 0)}
        </span>
        <span className="badge">
          مرتفع: {String(system.major_count || 0)}
        </span>
        <span className="badge">
          منخفض: {String(system.minor_count || 0)}
        </span>
        <span className="badge">
          الاستحقاق التالي: {String(system.next_due_date || "-")}
        </span>
      </div>
    </div>
  );
}
