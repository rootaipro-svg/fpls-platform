"use client";

import { useEffect, useState } from "react";
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
    inspection_interval_days?: string;
    last_inspected_at?: string;
    next_due_date?: string;
  };
};

function addDays(dateString: string, days: number) {
  const dt = new Date(String(dateString || ""));
  if (Number.isNaN(dt.getTime())) return "";
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

export default function EditAssetForm({ asset }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    asset_code: String(asset.asset_code || ""),
    asset_name: String(asset.asset_name || ""),
    asset_name_ar: String(asset.asset_name_ar || ""),
    asset_type: String(asset.asset_type || ""),
    location_note: String(asset.location_note || ""),
    status: String(asset.status || "active"),
    inspection_interval_days: String(asset.inspection_interval_days || ""),
    last_inspected_at: String(asset.last_inspected_at || ""),
    next_due_date: String(asset.next_due_date || ""),
  });

  const [autoNextDue, setAutoNextDue] = useState(
    String(asset.next_due_date || "")
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const days = Number(form.inspection_interval_days || 0);
    if (form.last_inspected_at && days > 0) {
      setAutoNextDue(addDays(form.last_inspected_at, days));
    } else {
      setAutoNextDue("");
    }
  }, [form.inspection_interval_days, form.last_inspected_at]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        next_due_date: form.next_due_date || autoNextDue || "",
      };

      const res = await fetch(`/api/assets/${asset.asset_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر تعديل الأصل");
      }

      setMessage("تم تحديث الأصل وجدول الاستحقاق بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تعديل الأصل");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <div className="section-title">تعديل الأصل وجدول الاستحقاق</div>
      <div className="section-subtitle">
        عدّل بيانات الأصل وجدول الفحص الخاص به دون التأثير على ربطه الحالي.
      </div>

      <form
        onSubmit={handleSubmit}
        className="stack-3"
        style={{ marginTop: "14px" }}
      >
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
          onChange={(e) =>
            setForm((p) => ({ ...p, asset_name_ar: e.target.value }))
          }
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
          onChange={(e) =>
            setForm((p) => ({ ...p, location_note: e.target.value }))
          }
        />

        <select
          className="field"
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="out_of_service">out_of_service</option>
          <option value="retired">retired</option>
        </select>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "14px",
            background: "#f8fafc",
          }}
        >
          <div className="section-title" style={{ fontSize: "15px" }}>
            جدول استحقاق الأصل
          </div>
          <div className="section-subtitle" style={{ marginTop: "6px" }}>
            يمكنك تحديد الدورة بالأيام، وآخر فحص، وسيتم احتساب الاستحقاق التالي.
          </div>

          <input
            className="field"
            type="number"
            min="0"
            placeholder="دورة الفحص بالأيام مثل 30 أو 90 أو 365"
            value={form.inspection_interval_days}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                inspection_interval_days: e.target.value,
              }))
            }
            style={{ marginTop: "12px" }}
          />

          <input
            className="field"
            type="date"
            value={form.last_inspected_at}
            onChange={(e) =>
              setForm((p) => ({ ...p, last_inspected_at: e.target.value }))
            }
            style={{ marginTop: "12px" }}
          />

          <input
            className="field"
            type="date"
            value={form.next_due_date}
            onChange={(e) =>
              setForm((p) => ({ ...p, next_due_date: e.target.value }))
            }
            style={{ marginTop: "12px" }}
          />

          <div className="badge-wrap" style={{ marginTop: "12px" }}>
            <span className="badge">
              الاستحقاق المحسوب: {autoNextDue || "غير محسوب"}
            </span>
          </div>
        </div>

        {message ? <div className="alert-success">{message}</div> : null}
        {error ? <div className="alert-error">{error}</div> : null}

        <button type="submit" className="btn btn-grow" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </button>
      </form>
    </section>
  );
}
