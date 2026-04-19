export function toArabicDigits(input: string | number) {
  return String(input).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function safeText(value: any, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function toStatusLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    active: "نشط (Active)",
    inactive: "غير نشط (Inactive)",
    planned: "مجدولة (Planned)",
    open: "مفتوحة (Open)",
    in_progress: "قيد التنفيذ (In Progress)",
    completed: "مكتملة (Completed)",
    closed: "مغلقة (Closed)",
    pending: "قيد الانتظار (Pending)",
    overdue: "متأخر (Overdue)",
    due: "مستحق (Due)",
    compliant: "مطابق (Compliant)",
    non_compliant: "غير مطابق (Non-Compliant)",
    not_applicable: "غير منطبق (Not Applicable)",
  };

  return map[v] || String(value || "-");
}

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

export function toFacilityTypeLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    office: "مكتبي (Office)",
    healthcare: "صحي (Healthcare)",
    residential: "سكني (Residential)",
    industrial: "صناعي (Industrial)",
    warehouse: "مستودع (Warehouse)",
    retail: "تجاري (Retail)",
    hospitality: "ضيافة (Hospitality)",
    education: "تعليمي (Education)",
    mixed_use: "متعدد الاستخدامات (Mixed Use)",
    single_building: "مبنى واحد (Single Building)",
    campus: "مجمع (Campus)",
  };

  return map[v] || String(value || "-");
}

export function toSystemLabel(value: any) {
  const v = String(value || "").trim().toUpperCase();

  const map: Record<string, string> = {
    "FP-DIESEL-PUMP": "مضخة حريق ديزل (Fire Pump - Diesel)",
    "FP-ELECTRIC-PUMP": "مضخة حريق كهربائية (Fire Pump - Electric)",
    "FIRE-EXTINGUISHER": "طفايات الحريق (Fire Extinguisher)",
    "FIRE-DOOR": "أبواب الحريق (Fire Door)",
    "FA-VOICE": "إنذار صوتي (Voice Alarm)",
    "FA-ADDR": "إنذار معنّون (Addressable Fire Alarm)",
    "SP-WET": "رش آلي مائي (Wet Sprinkler)",
    "HOSE-REEL": "بكرة خرطوم (Hose Reel)",
    "EMERGENCY-LIGHT": "إنارة طوارئ (Emergency Light)",
    HVAC: "التكييف والتهوية (HVAC)",
    PLUMBING: "السباكة (Plumbing)",
    FIRE_ALARM: "إنذار الحريق (Fire Alarm)",
  };

  return map[v] || String(value || "-");
}

export function toResponseLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    compliant: "مطابق",
    non_compliant: "غير مطابق",
    not_applicable: "غير منطبق",
    pass: "ناجح",
    fail: "غير ناجح",
    check: "يحتاج مراجعة",
  };

  return map[v] || String(value || "-");
}

export function toSeverityLabel(value: any) {
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

export function formatDateLabel(value: any) {
  const raw = String(value || "").trim();
  if (!raw) return "-";

  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return raw;

  return dt.toISOString().slice(0, 10);
}
