"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BuildingOption = {
  building_id: string;
  building_name: string;
};

type SystemOption = {
  system_code: string;
  system_name: string;
};

type Props = {
  buildings: BuildingOption[];
  systems: SystemOption[];
};

type FormState = {
  building_id: string;
  system_code: string;
  system_name_override: string;
  system_instance_code: string;
  coverage_scope: string;
  protection_area: string;
  standard_profile: string;
  authority_profile_id: string;
  manufacturer: string;
  model: string;
  serial_no: string;
  install_date: string;
  commission_date: string;
  service_provider: string;
  approval_lab_code: string;
  criticality_class: string;
  next_inspection_anchor_date: string;
  notes: string;
};

const initialState: FormState = {
  building_id: "",
  system_code: "",
  system_name_override: "",
  system_instance_code: "",
  coverage_scope: "",
  protection_area: "",
  standard_profile: "",
  authority_profile_id: "default_ksa",
  manufacturer: "",
  model: "",
  serial_no: "",
  install_date: "",
  commission_date: "",
  service_provider: "",
  approval_lab_code: "",
  criticality_class: "primary",
  next_inspection_anchor_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function AddSystemForm({ buildings, systems }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    ...initialState,
    building_id: buildings[0]?.building_id || "",
    system_code: systems[0]?.system_code || "",
    standard_profile: systems[0]?.system_code || "",
  });

  const canSubmit = useMemo(() => {
    return form.building_id.trim() && form.system_code.trim();
  }, [form.building_id, form.system_code]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSystemChange(systemCode: string) {
    updateField("system_code", systemCode);
    if (!form.standard_profile) {
      updateField("standard_profile", systemCode);
    } else {
      updateField("standard_profile", systemCode);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("يرجى اختيار المبنى والنظام.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/systems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إضافة النظام");
      }

      setMessage("تمت إضافة النظام بنجاح");
      setForm({
        ...initialState,
        building_id: buildings[0]?.building_id || "",
        system_code: systems[0]?.system_code || "",
        standard_profile: systems[0]?.system_code || "",
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إضافة النظام");
    } finally {
      setSaving(false);
    }
  }

  if (buildings.length === 0) {
    return (
      <div className="card">
        <div className="section-title">إضافة نظام</div>
        <div className="section-subtitle">
          يجب إضافة مبنى أولًا قبل ربط أي نظام.
        </div>
      </div>
    );
  }

  if (systems.length === 0) {
    return (
      <div className="card">
        <div className="section-title">إضافة نظام</div>
        <div className="section-subtitle">
          لا توجد أنظمة مرجعية متاحة في SYSTEMS_REF.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-header-row">
        <div>
          <div className="section-title">إضافة نظام للمبنى</div>
          <div className="section-subtitle">
            اربط نظام حماية أو سلامة بمبنى موجود داخل هذه المنشأة
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "إغلاق" : "+ إضافة نظام"}
        </button>
      </div>

      {message ? (
        <div className="alert-success" style={{ marginTop: "12px" }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="alert-error" style={{ marginTop: "12px" }}>
          {error}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="stack-3" style={{ marginTop: "14px" }}>
          <select
            className="select"
            value={form.building_id}
            onChange={(e) => updateField("building_id", e.target.value)}
          >
            {buildings.map((building) => (
              <option key={building.building_id} value={building.building_id}>
                {building.building_name}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={form.system_code}
            onChange={(e) => handleSystemChange(e.target.value)}
          >
            {systems.map((system) => (
              <option key={system.system_code} value={system.system_code}>
                {system.system_name}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="اسم النظام المخصص داخل المشروع"
            value={form.system_name_override}
            onChange={(e) => updateField("system_name_override", e.target.value)}
          />

          <input
            className="input"
            placeholder="رمز/كود النظام الداخلي"
            value={form.system_instance_code}
            onChange={(e) => updateField("system_instance_code", e.target.value)}
          />

          <input
            className="input"
            placeholder="نطاق التغطية"
            value={form.coverage_scope}
            onChange={(e) => updateField("coverage_scope", e.target.value)}
          />

          <input
            className="input"
            placeholder="منطقة الحماية"
            value={form.protection_area}
            onChange={(e) => updateField("protection_area", e.target.value)}
          />

          <input
            className="input"
            placeholder="الملف المرجعي للمعيار"
            value={form.standard_profile}
            onChange={(e) => updateField("standard_profile", e.target.value)}
          />

          <input
            className="input"
            placeholder="Authority profile"
            value={form.authority_profile_id}
            onChange={(e) => updateField("authority_profile_id", e.target.value)}
          />

          <input
            className="input"
            placeholder="الشركة المصنعة"
            value={form.manufacturer}
            onChange={(e) => updateField("manufacturer", e.target.value)}
          />

          <input
            className="input"
            placeholder="الموديل"
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
          />

          <input
            className="input"
            placeholder="الرقم التسلسلي"
            value={form.serial_no}
            onChange={(e) => updateField("serial_no", e.target.value)}
          />

          <input
            className="input"
            type="date"
            value={form.install_date}
            onChange={(e) => updateField("install_date", e.target.value)}
          />

          <input
            className="input"
            type="date"
            value={form.commission_date}
            onChange={(e) => updateField("commission_date", e.target.value)}
          />

          <input
            className="input"
            placeholder="مقدم الخدمة"
            value={form.service_provider}
            onChange={(e) => updateField("service_provider", e.target.value)}
          />

          <input
            className="input"
            placeholder="Approval / Lab code"
            value={form.approval_lab_code}
            onChange={(e) => updateField("approval_lab_code", e.target.value)}
          />

          <select
            className="select"
            value={form.criticality_class}
            onChange={(e) => updateField("criticality_class", e.target.value)}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="support">Support</option>
          </select>

          <input
            className="input"
            type="date"
            value={form.next_inspection_anchor_date}
            onChange={(e) =>
              updateField("next_inspection_anchor_date", e.target.value)
            }
          />

          <textarea
            className="textarea"
            placeholder="ملاحظات"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          <div className="btn-row">
            <button type="submit" className="btn btn-grow" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ النظام"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
