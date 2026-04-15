"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckSquare, Plus, Search, ShieldCheck } from "lucide-react";

type FacilityOption = {
  facility_id: string;
  facility_name: string;
};

type SystemOption = {
  system_code: string;
  system_name: string;
};

type Props = {
  facilities: FacilityOption[];
  systems: SystemOption[];
};

type FormState = {
  facility_id: string;
  building_name: string;
  building_name_ar: string;
  building_use: string;
  construction_type: string;
  number_of_floors: string;
  basement_count: string;
  building_height_m: string;
  area_m2: string;
  occupancy_profile_id: string;
  risk_profile_id: string;
  year_built: string;
  civil_defense_permit_no: string;
  evacuation_strategy: string;
  notes: string;
  system_codes: string[];
};

const initialState: FormState = {
  facility_id: "",
  building_name: "",
  building_name_ar: "",
  building_use: "office",
  construction_type: "concrete",
  number_of_floors: "1",
  basement_count: "0",
  building_height_m: "",
  area_m2: "",
  occupancy_profile_id: "office",
  risk_profile_id: "ordinary",
  year_built: "",
  civil_defense_permit_no: "",
  evacuation_strategy: "",
  notes: "",
  system_codes: [],
};

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

const buildingUses = [
  { value: "office", label: "مكاتب" },
  { value: "commercial", label: "تجاري" },
  { value: "industrial", label: "صناعي" },
  { value: "warehouse", label: "مستودع" },
  { value: "residential", label: "سكني" },
  { value: "hospital", label: "مستشفى" },
  { value: "hotel", label: "فندقي" },
  { value: "school", label: "مدرسة" },
  { value: "mixed_use", label: "متعدد الاستخدام" },
];

const occupancyProfiles = [
  { value: "office", label: "مكاتب" },
  { value: "mercantile", label: "تجاري / بيع" },
  { value: "assembly", label: "تجمع" },
  { value: "industrial", label: "صناعي" },
  { value: "storage", label: "تخزين" },
  { value: "residential_highrise", label: "سكني مرتفع" },
  { value: "residential_lowrise", label: "سكني منخفض" },
  { value: "healthcare", label: "صحي" },
  { value: "educational", label: "تعليمي" },
  { value: "hotel", label: "فندقي" },
  { value: "mixed_use", label: "متعدد الاستخدام" },
];

const riskProfiles = [
  { value: "ordinary", label: "اعتيادي" },
  { value: "light_hazard", label: "خفيف الخطورة" },
  { value: "ordinary_group1", label: "اعتيادي 1" },
  { value: "ordinary_group2", label: "اعتيادي 2" },
  { value: "extra_hazard_group1", label: "خطورة عالية 1" },
  { value: "extra_hazard_group2", label: "خطورة عالية 2" },
  { value: "special_hazard", label: "خطورة خاصة" },
];

export default function AddBuildingForm({ facilities, systems }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [systemSearch, setSystemSearch] = useState("");

  const [form, setForm] = useState<FormState>({
    ...initialState,
    facility_id: facilities[0]?.facility_id || "",
  });

  const canSubmit = useMemo(() => {
    return (
      form.facility_id.trim() &&
      form.building_name.trim() &&
      form.building_use.trim() &&
      form.occupancy_profile_id.trim() &&
      form.risk_profile_id.trim()
    );
  }, [form]);

  const filteredSystems = useMemo(() => {
    const q = systemSearch.trim().toLowerCase();
    if (!q) return systems;

    return systems.filter((system) => {
      const name = system.system_name.toLowerCase();
      const code = system.system_code.toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [systems, systemSearch]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSystem(systemCode: string) {
    setForm((prev) => {
      const exists = prev.system_codes.includes(systemCode);
      return {
        ...prev,
        system_codes: exists
          ? prev.system_codes.filter((code) => code !== systemCode)
          : [...prev.system_codes, systemCode],
      };
    });
  }

  function selectAllFiltered() {
    setForm((prev) => {
      const merged = new Set([
        ...prev.system_codes,
        ...filteredSystems.map((s) => s.system_code),
      ]);
      return {
        ...prev,
        system_codes: Array.from(merged),
      };
    });
  }

  function clearAllSystems() {
    setForm((prev) => ({
      ...prev,
      system_codes: [],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("يرجى تعبئة الحقول الأساسية.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إنشاء المبنى");
      }

      setMessage(
        `تم إنشاء المبنى بنجاح${
          data.data?.systems_created
            ? ` وتم ربط ${data.data.systems_created} نظام`
            : ""
        }`
      );

      setForm({
        ...initialState,
        facility_id: facilities[0]?.facility_id || "",
      });

      setSystemSearch("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إنشاء المبنى");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">إضافة مبنى</div>
          <div className="mt-1 text-sm text-slate-500">
            أضف مبنى جديدًا وحدد الأنظمة الموجودة داخله
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          {open ? "إغلاق" : "مبنى جديد"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <select
            className={fieldClass}
            value={form.facility_id}
            onChange={(e) => updateField("facility_id", e.target.value)}
          >
            {facilities.map((facility) => (
              <option key={facility.facility_id} value={facility.facility_id}>
                {facility.facility_name}
              </option>
            ))}
          </select>

          <input
            className={fieldClass}
            placeholder="اسم المبنى *"
            value={form.building_name}
            onChange={(e) => updateField("building_name", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="اسم المبنى بالعربية"
            value={form.building_name_ar}
            onChange={(e) => updateField("building_name_ar", e.target.value)}
          />

          <select
            className={fieldClass}
            value={form.building_use}
            onChange={(e) => updateField("building_use", e.target.value)}
          >
            {buildingUses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            className={fieldClass}
            placeholder="نوع الإنشاء"
            value={form.construction_type}
            onChange={(e) => updateField("construction_type", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="عدد الأدوار"
            type="number"
            value={form.number_of_floors}
            onChange={(e) => updateField("number_of_floors", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="عدد الأقبية"
            type="number"
            value={form.basement_count}
            onChange={(e) => updateField("basement_count", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="ارتفاع المبنى (م)"
            value={form.building_height_m}
            onChange={(e) => updateField("building_height_m", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="المساحة (م²)"
            value={form.area_m2}
            onChange={(e) => updateField("area_m2", e.target.value)}
          />

          <select
            className={fieldClass}
            value={form.occupancy_profile_id}
            onChange={(e) => updateField("occupancy_profile_id", e.target.value)}
          >
            {occupancyProfiles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={form.risk_profile_id}
            onChange={(e) => updateField("risk_profile_id", e.target.value)}
          >
            {riskProfiles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-teal-700" />
                  الأنظمة الموجودة في المبنى
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  الأنظمة المختارة: {form.system_codes.length}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  تحديد المعروض
                </button>

                <button
                  type="button"
                  onClick={clearAllSystems}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                >
                  مسح
                </button>
              </div>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                placeholder="ابحث باسم النظام أو الكود"
                value={systemSearch}
                onChange={(e) => setSystemSearch(e.target.value)}
              />
            </div>

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredSystems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                  لا توجد أنظمة مطابقة للبحث
                </div>
              ) : (
                filteredSystems.map((system) => {
                  const checked = form.system_codes.includes(system.system_code);

                  return (
                    <label
                      key={system.system_code}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                        checked
                          ? "border-teal-300 bg-teal-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0"
                        checked={checked}
                        onChange={() => toggleSystem(system.system_code)}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="break-words text-sm font-semibold text-slate-900">
                          {system.system_name}
                        </div>
                        <div className="mt-1 text-xs break-all text-slate-500">
                          {system.system_code}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <input
            className={fieldClass}
            placeholder="سنة الإنشاء"
            value={form.year_built}
            onChange={(e) => updateField("year_built", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="رقم تصريح الدفاع المدني"
            value={form.civil_defense_permit_no}
            onChange={(e) => updateField("civil_defense_permit_no", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="استراتيجية الإخلاء"
            value={form.evacuation_strategy}
            onChange={(e) => updateField("evacuation_strategy", e.target.value)}
          />

          <textarea
            className={`${fieldClass} min-h-[96px] resize-none`}
            placeholder="ملاحظات"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "جارٍ الحفظ..." : "حفظ المبنى"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
