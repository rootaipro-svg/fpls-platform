export function safeText(value: any, fallback = "-") {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : fallback;
}

export function toSystemLabel(value: any) {
  const v = String(value || "").trim().toUpperCase();

  const map: Record<string, string> = {
    FP_DIESEL_PUMP: "مضخة حريق ديزل (Fire Pump - Diesel)",
    "FP-DIESEL-PUMP": "مضخة حريق ديزل (Fire Pump - Diesel)",

    FP_ELECTRIC_PUMP: "مضخة حريق كهربائية (Fire Pump - Electric)",
    "FP-ELECTRIC-PUMP": "مضخة حريق كهربائية (Fire Pump - Electric)",

    JOCKEY_PUMP: "مضخة جوكي (Jockey Pump)",
    "JOCKEY-PUMP": "مضخة جوكي (Jockey Pump)",

    FIRE_ALARM: "إنذار الحريق (Fire Alarm)",
    FA: "إنذار الحريق (Fire Alarm)",
    "FA-ADDR": "إنذار حريق معنْون (Addressable Fire Alarm)",
    "FA-VOICE": "إنذار صوتي (Voice Evacuation)",

    SP_WET: "رش آلي مائي (Wet Sprinkler)",
    "SP-WET": "رش آلي مائي (Wet Sprinkler)",

    SP_DRY: "رش آلي جاف (Dry Sprinkler)",
    "SP-DRY": "رش آلي جاف (Dry Sprinkler)",

    HOSE_REEL: "بكرة حريق (Hose Reel)",
    "HOSE-REEL": "بكرة حريق (Hose Reel)",

    FIRE_EXTINGUISHER: "طفاية حريق (Fire Extinguisher)",
    "FIRE-EXTINGUISHER": "طفاية حريق (Fire Extinguisher)",

    FIRE_DOOR: "باب مقاوم للحريق (Fire Door)",
    "FIRE-DOOR": "باب مقاوم للحريق (Fire Door)",

    EMERGENCY_LIGHT: "إنارة طوارئ (Emergency Light)",
    "EMERGENCY-LIGHT": "إنارة طوارئ (Emergency Light)",

    EXIT_SIGN: "لوحة مخرج (Exit Sign)",
    "EXIT-SIGN": "لوحة مخرج (Exit Sign)",

    FM200: "نظام غاز FM200 (FM200 System)",
    CLEAN_AGENT: "نظام إطفاء غازي (Clean Agent System)",
    KITCHEN_HOOD: "إطفاء مطبخ (Kitchen Hood Suppression)",
    FOAM_SYSTEM: "نظام رغوي (Foam System)",

    FIRE_PUMP: "مضخة حريق (Fire Pump)",
    "FIRE-PUMP": "مضخة حريق (Fire Pump)",

    LANDING_VALVE: "محبس حريق (Landing Valve)",
    "LANDING-VALVE": "محبس حريق (Landing Valve)",
  };

  if (map[v]) return map[v];

  const cleaned = v.replace(/[_-]+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : "نظام غير محدد";
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

  return map[v] || safeText(value, "زيارة");
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

  return map[v] || safeText(value);
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

  return map[v] || safeText(value);
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

  return map[v] || safeText(value);
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
