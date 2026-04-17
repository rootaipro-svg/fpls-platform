"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SystemOption = {
  building_system_id: string;
  system_code: string;
  building_name: string;
  label: string;
};

type Props = {
  systems: SystemOption[];
};

type FormState = {
  building_system_id: string;
  asset_code: string;
  asset_name: string;
  asset_name_ar: string;
  asset_type: string;
  location_note: string;
  status: string;
};

const initialState: FormState = {
  building_system_id: "",
  asset_code: "",
  asset_name: "",
  asset_name_ar: "",
  asset_type: "",
  location_note: "",
  status: "active",
};

export default function AddAssetForm({ systems }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    ...initialState,
    building_system_id: systems[0]?.building_system_id || "",
  });

  const canSubmit = useMemo(() => {
    return (
      form.building_system_id.trim() &&
      form.asset_name.trim()
    );
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("أكمل الحقول الأساسية: النظام، واسم الأصل.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إضافة الأصل");
      }

      setMessage("تمت إضافة الأصل بنجاح");
      setForm({
        ...initialState,
        building_system_id: systems[0]?.building_system_id || "",
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إضافة الأصل");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-header-row">
        <div>
          <div className="section-title">الأصول والمكونات</div>
          <div className="section-subtitle">
            أضف أصلًا أو معدة فعلية تحت نظام محدد، تمهيدًا لربطها بـ QR لاحقًا.
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "إغلاق النموذج" : "إضافة أصل"}
        </button>
      </div>

      {message ? (
        <div className="alert-success" style={{ marginTop: "12px" }}>
          {message}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="stack-3" style={{ marginTop: "16px" }}>
          <select
            className="field"
            value={form.building_system_id}
            onChange={(e) => updateField("building_system_id", e.target.value)}
          >
            <option value="">اختر النظام</option>
            {systems.map((system) => (
              <option
                key={system.building_system_id}
                value={system.building_system_id}
              >
                {system.label}
              </option>
            ))}
          </select>

          <input
            className="field"
            placeholder="كود الأصل (اختياري)"
            value={form.asset_code}
            onChange={(e) => updateField("asset_code", e.target.value)}
          />

          <input
            className="field"
            placeholder="اسم الأصل *"
            value={form.asset_name}
            onChange={(e) => updateField("asset_name", e.target.value)}
          />

          <input
            className="field"
            placeholder="اسم الأصل بالعربية"
            value={form.asset_name_ar}
            onChange={(e) => updateField("asset_name_ar", e.target.value)}
          />

          <input
            className="field"
            placeholder="نوع الأصل / المكوّن"
            value={form.asset_type}
            onChange={(e) => updateField("asset_type", e.target.value)}
          />

          <textarea
            className="field"
            placeholder="موقع الأصل أو ملاحظة المكان"
            value={form.location_note}
            onChange={(e) => updateField("location_note", e.target.value)}
          />

          <select
            className="field"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>

          {error ? <div className="alert-error">{error}</div> : null}

          <div className="btn-row">
            <button type="submit" className="btn btn-grow" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ الأصل"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
