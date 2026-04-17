"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  asset: {
    asset_id: string;
    asset_code: string;
    asset_name: string;
    asset_name_ar: string;
    asset_type: string;
    location_note: string;
    status: string;
  };
};

export default function EditAssetForm({ asset }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    asset_code: String(asset.asset_code || ""),
    asset_name: String(asset.asset_name || ""),
    asset_name_ar: String(asset.asset_name_ar || ""),
    asset_type: String(asset.asset_type || ""),
    location_note: String(asset.location_note || ""),
    status: String(asset.status || "active"),
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/assets/${asset.asset_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر تعديل الأصل");
      }

      setMessage("تم تحديث الأصل بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تعديل الأصل");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <div className="section-title">تعديل الأصل</div>
      <div className="section-subtitle">
        عدّل بيانات الأصل دون التأثير على ربطه الحالي بالمنشأة والنظام.
      </div>

      <form onSubmit={handleSubmit} className="stack-3" style={{ marginTop: "14px" }}>
        <input
          className="field"
          placeholder="كود الأصل"
          value={form.asset_code}
          onChange={(e) => setForm((p) => ({ ...p, asset_code: e.target.value }))}
        />

        <input
          className="field"
          placeholder="اسم الأصل"
          value={form.asset_name}
          onChange={(e) => setForm((p) => ({ ...p, asset_name: e.target.value }))}
        />

        <input
          className="field"
          placeholder="اسم الأصل بالعربية"
          value={form.asset_name_ar}
          onChange={(e) => setForm((p) => ({ ...p, asset_name_ar: e.target.value }))}
        />

        <input
          className="field"
          placeholder="نوع الأصل"
          value={form.asset_type}
          onChange={(e) => setForm((p) => ({ ...p, asset_type: e.target.value }))}
        />

        <textarea
          className="field"
          placeholder="موقع الأصل أو ملاحظة المكان"
          value={form.location_note}
          onChange={(e) => setForm((p) => ({ ...p, location_note: e.target.value }))}
        />

        <select
          className="field"
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>

        {message ? <div className="alert-success">{message}</div> : null}
        {error ? <div className="alert-error">{error}</div> : null}

        <button type="submit" className="btn btn-grow" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </button>
      </form>
    </section>
  );
}
