"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

type FormState = {
  facility_name: string;
  facility_name_ar: string;
  owner_name: string;
  operator_name: string;
  facility_type: string;
  occupancy_classification: string;
  city: string;
  district: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  notes: string;
};

const initialState: FormState = {
  facility_name: "",
  facility_name_ar: "",
  owner_name: "",
  operator_name: "",
  facility_type: "commercial",
  occupancy_classification: "office",
  city: "",
  district: "",
  address: "",
  contact_person: "",
  contact_phone: "",
  contact_email: "",
  notes: "",
};

const fieldClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100";

const facilityTypes = [
  { value: "commercial", label: "تجاري" },
  { value: "industrial", label: "صناعي" },
  { value: "residential", label: "سكني" },
  { value: "healthcare", label: "صحي" },
  { value: "hospitality", label: "فندقي" },
  { value: "education", label: "تعليمي" },
  { value: "mixed_use", label: "متعدد الاستخدام" },
  { value: "government", label: "حكومي" },
];

const occupancyTypes = [
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

export default function AddFacilityForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.facility_name.trim() &&
      form.city.trim() &&
      form.facility_type.trim() &&
      form.occupancy_classification.trim()
    );
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("يرجى تعبئة الحقول الأساسية.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إنشاء المنشأة");
      }

      setMessage("تم إنشاء المنشأة بنجاح");
      setForm(initialState);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إنشاء المنشأة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900">إضافة منشأة</div>
          <div className="mt-1 text-sm text-slate-500">
            سجل منشأة جديدة داخل النظام مع بياناتها الأساسية
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          {open ? "إغلاق" : "منشأة جديدة"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            className={fieldClass}
            placeholder="اسم المنشأة *"
            value={form.facility_name}
            onChange={(e) => updateField("facility_name", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="اسم المنشأة بالعربية"
            value={form.facility_name_ar}
            onChange={(e) => updateField("facility_name_ar", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="اسم المالك"
            value={form.owner_name}
            onChange={(e) => updateField("owner_name", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="اسم المشغل"
            value={form.operator_name}
            onChange={(e) => updateField("operator_name", e.target.value)}
          />

          <select
            className={fieldClass}
            value={form.facility_type}
            onChange={(e) => updateField("facility_type", e.target.value)}
          >
            {facilityTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            className={fieldClass}
            value={form.occupancy_classification}
            onChange={(e) => updateField("occupancy_classification", e.target.value)}
          >
            {occupancyTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            className={fieldClass}
            placeholder="المدينة *"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="الحي"
            value={form.district}
            onChange={(e) => updateField("district", e.target.value)}
          />

          <textarea
            className={`${fieldClass} min-h-[96px] resize-none`}
            placeholder="العنوان"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="اسم جهة الاتصال"
            value={form.contact_person}
            onChange={(e) => updateField("contact_person", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="رقم الجوال"
            value={form.contact_phone}
            onChange={(e) => updateField("contact_phone", e.target.value)}
          />

          <input
            className={fieldClass}
            placeholder="البريد الإلكتروني"
            type="email"
            value={form.contact_email}
            onChange={(e) => updateField("contact_email", e.target.value)}
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
              disabled={saving}
              className="flex-1 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ المنشأة"}
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
