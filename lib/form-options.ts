export type OptionItem = {
  value: string;
  label: string;
};

export const FACILITY_TYPE_OPTIONS: OptionItem[] = [
  { value: "commercial", label: "تجاري (Commercial)" },
  { value: "office", label: "مكتبي (Office)" },
  { value: "healthcare", label: "صحي (Healthcare)" },
  { value: "residential", label: "سكني (Residential)" },
  { value: "hospitality", label: "فندقي (Hospitality)" },
  { value: "industrial", label: "صناعي (Industrial)" },
  { value: "warehouse", label: "مستودعات (Warehouse)" },
  { value: "educational", label: "تعليمي (Educational)" },
  { value: "government", label: "حكومي (Government)" },
  { value: "mixed_use", label: "متعدد الاستخدام (Mixed Use)" },
];

export const OCCUPANCY_OPTIONS: OptionItem[] = [
  { value: "assembly", label: "تجمعات (Assembly)" },
  { value: "business", label: "أعمال (Business)" },
  { value: "educational", label: "تعليمي (Educational)" },
  { value: "factory", label: "مصانع (Factory)" },
  { value: "healthcare", label: "رعاية صحية (Healthcare)" },
  { value: "high_hazard", label: "خطورة عالية (High Hazard)" },
  { value: "mercantile", label: "تجاري / بيع (Mercantile)" },
  { value: "residential", label: "سكني (Residential)" },
  { value: "storage", label: "تخزين (Storage)" },
  { value: "utility", label: "خدمي (Utility)" },
];

export const STATUS_OPTIONS: OptionItem[] = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "archived", label: "مؤرشف" },
];

export const BUILDING_USE_OPTIONS: OptionItem[] = [
  { value: "office", label: "مكاتب (Office)" },
  { value: "residential", label: "سكني (Residential)" },
  { value: "healthcare", label: "صحي (Healthcare)" },
  { value: "hotel", label: "فندقي (Hotel)" },
  { value: "warehouse", label: "مستودع (Warehouse)" },
  { value: "retail", label: "تجاري / بيع (Retail)" },
  { value: "school", label: "تعليمي (School)" },
  { value: "industrial", label: "صناعي (Industrial)" },
  { value: "mixed_use", label: "متعدد الاستخدام (Mixed Use)" },
];

export const CONSTRUCTION_TYPE_OPTIONS: OptionItem[] = [
  { value: "reinforced_concrete", label: "خرسانة مسلحة" },
  { value: "steel", label: "هيكل فولاذي" },
  { value: "masonry", label: "مباني / بلوك" },
  { value: "mixed", label: "مختلط" },
  { value: "pre_engineered", label: "مسبق الهندسة" },
];

export const EVACUATION_OPTIONS: OptionItem[] = [
  { value: "total", label: "إخلاء كامل" },
  { value: "phased", label: "إخلاء مرحلي" },
  { value: "defend_in_place", label: "الاحتماء بالمكان" },
  { value: "horizontal", label: "إخلاء أفقي" },
];

export const SYSTEM_CODE_OPTIONS: OptionItem[] = [
  { value: "FP_DIESEL_PUMP", label: "مضخة حريق ديزل" },
  { value: "FP_ELECTRIC_PUMP", label: "مضخة حريق كهربائية" },
  { value: "FP_JOCKEY", label: "مضخة جوكي" },
  { value: "FIRE_ALARM", label: "إنذار حريق" },
  { value: "FA_VOICE", label: "إنذار صوتي" },
  { value: "FIRE_EXTINGUISHER", label: "طفايات حريق" },
  { value: "HOSE_REEL", label: "بكرة حريق" },
  { value: "SPRINKLER_WET", label: "رش آلي رطب" },
  { value: "SPRINKLER_DRY", label: "رش آلي جاف" },
  { value: "STANDPIPE", label: "شبكة مواسير قائمة" },
  { value: "FIRE_DOOR", label: "باب مقاوم للحريق" },
  { value: "EMERGENCY_LIGHT", label: "إنارة طوارئ" },
  { value: "EXIT_SIGN", label: "لوحات مخارج" },
  { value: "CLEAN_AGENT", label: "إطفاء عامل نظيف" },
  { value: "FM200", label: "FM200" },
  { value: "CO2", label: "CO2" },
  { value: "KITCHEN_SUPPRESSION", label: "إطفاء مطابخ" },
  { value: "SMOKE_CONTROL", label: "تحكم دخان" },
];

export const STANDARD_PROFILE_OPTIONS: OptionItem[] = [
  { value: "NFPA_10", label: "NFPA 10" },
  { value: "NFPA_13", label: "NFPA 13" },
  { value: "NFPA_14", label: "NFPA 14" },
  { value: "NFPA_20", label: "NFPA 20" },
  { value: "NFPA_25", label: "NFPA 25" },
  { value: "NFPA_72", label: "NFPA 72" },
  { value: "NFPA_80", label: "NFPA 80" },
  { value: "NFPA_101", label: "NFPA 101" },
  { value: "SBC_801", label: "SBC 801" },
  { value: "SBC_201", label: "SBC 201" },
  { value: "CIVIL_DEFENSE", label: "اشتراطات الدفاع المدني" },
];

export const CRITICALITY_OPTIONS: OptionItem[] = [
  { value: "critical", label: "حرج" },
  { value: "high", label: "مرتفع" },
  { value: "medium", label: "متوسط" },
  { value: "low", label: "منخفض" },
];

export const SYSTEM_STATUS_OPTIONS: OptionItem[] = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
  { value: "out_of_service", label: "خارج الخدمة" },
  { value: "archived", label: "مؤرشف" },
];
