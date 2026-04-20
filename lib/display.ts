export function toVisitTypeLabel(value: any) {
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

export function toVisitStatusLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    planned: "مجدولة (Planned)",
    open: "مفتوحة (Open)",
    in_progress: "قيد التنفيذ (In Progress)",
    inprogress: "قيد التنفيذ (In Progress)",
    completed: "مكتملة (Completed)",
    closed: "مغلقة (Closed)",
    draft: "مسودة (Draft)",
    cancelled: "ملغاة (Cancelled)",
  };

  return map[v] || String(value || "-");
}

export function toSummaryResultLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    compliant: "مطابق (Compliant)",
    non_compliant: "غير مطابق (Non-Compliant)",
    critical_findings: "مخالفات حرجة (Critical Findings)",
    fail_critical: "فشل حرج (Critical Failure)",
    pass_with_remarks: "ناجح مع ملاحظات (Pass with Remarks)",
    pending: "قيد الانتظار (Pending)",
  };

  return map[v] || String(value || "-");
}

export function toFindingSeverityLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    critical: "حرج (Critical)",
    major: "مرتفع (Major)",
    minor: "منخفض (Minor)",
    medium: "متوسط (Medium)",
    low: "منخفض (Low)",
  };

  return map[v] || String(value || "-");
}

export function isClosedVisitStatus(value: any) {
  const v = String(value || "").trim().toLowerCase();
  return v === "closed" || v === "completed";
}

export function isOpenFindingStatus(value: any) {
  const v = String(value || "").trim().toLowerCase();
  return v !== "closed";
}

export function isActiveRecord(value: any) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return true;
  return v !== "inactive" && v !== "disabled" && v !== "archived";
}
