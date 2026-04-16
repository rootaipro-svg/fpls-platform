"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialProfile: any;
};

type FormState = {
  company_name_ar: string;
  company_name_en: string;
  report_brand_name: string;
  logo_url: string;
  primary_color: string;
  contact_phone: string;
  contact_email: string;
  address_line: string;
  city: string;
  country: string;
  authorized_signatory_name: string;
  authorized_signatory_title: string;
  report_footer_note: string;
  stamp_note: string;
};

export default function TenantProfileForm({ initialProfile }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    company_name_ar: String(initialProfile.company_name_ar || ""),
    company_name_en: String(initialProfile.company_name_en || ""),
    report_brand_name: String(initialProfile.report_brand_name || ""),
    logo_url: String(initialProfile.logo_url || ""),
    primary_color: String(initialProfile.primary_color || "#0f766e"),
    contact_phone: String(initialProfile.contact_phone || ""),
    contact_email: String(initialProfile.contact_email || ""),
    address_line: String(initialProfile.address_line || ""),
    city: String(initialProfile.city || ""),
    country: String(initialProfile.country || "Saudi Arabia"),
    authorized_signatory_name: String(initialProfile.authorized_signatory_name || ""),
    authorized_signatory_title: String(initialProfile.authorized_signatory_title || ""),
    report_footer_note: String(initialProfile.report_footer_note || ""),
    stamp_note: String(initialProfile.stamp_note || ""),
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/settings/tenant", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ إعدادات العميل");
      }

      setMessage("تم حفظ إعدادات العميل بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ إعدادات العميل");
    } finally {
      setSaving(false);
    }
  }

  const displayName =
    form.report_brand_name || form.company_name_ar || "اسم الجهة";
  const fallback =
    (displayName || "FT").trim().slice(0, 2).toUpperCase();

  return (
    <div className="settings-grid">
      <div className="settings-preview-card">
        <div className="settings-preview-top">
          <div className="settings-logo-box">
            {form.logo_url ? (
              <img src={form.logo_url} alt="logo" />
            ) : (
              <span className="settings-logo-fallback">{fallback}</span>
            )}
          </div>

          <div>
            <div className="settings-preview-title">{displayName}</div>
            <div className="settings-preview-sub">
              {form.company_name_en || "Company name in English"}
            </div>
            <div className="settings-preview-sub">
              {form.city || "-"}
              {form.country ? ` · ${form.country}` : ""}
            </div>
          </div>
        </div>

        <div className="settings-preview-note">
          هذه المعاينة ستظهر لاحقًا داخل التقارير والطباعة وواجهة العميل.
        </div>
      </div>

      <div className="card">
        <div className="section-title">بيانات الجهة</div>
        <div className="section-subtitle">
          خصص هوية العميل وبيانات التقرير والتوقيع
        </div>

        <div className="stack-3" style={{ marginTop: "14px" }}>
          <input
            className="input"
            placeholder="اسم الجهة بالعربية"
            value={form.company_name_ar}
            onChange={(e) => updateField("company_name_ar", e.target.value)}
          />

          <input
            className="input"
            placeholder="اسم الجهة بالإنجليزية"
            value={form.company_name_en}
            onChange={(e) => updateField("company_name_en", e.target.value)}
          />

          <input
            className="input"
            placeholder="اسم العلامة داخل التقرير"
            value={form.report_brand_name}
            onChange={(e) => updateField("report_brand_name", e.target.value)}
          />

          <input
            className="input"
            placeholder="رابط الشعار Logo URL"
            value={form.logo_url}
            onChange={(e) => updateField("logo_url", e.target.value)}
          />

          <input
            className="input"
            placeholder="اللون الأساسي"
            value={form.primary_color}
            onChange={(e) => updateField("primary_color", e.target.value)}
          />

          <input
            className="input"
            placeholder="رقم التواصل"
            value={form.contact_phone}
            onChange={(e) => updateField("contact_phone", e.target.value)}
          />

          <input
            className="input"
            placeholder="البريد الإلكتروني"
            value={form.contact_email}
            onChange={(e) => updateField("contact_email", e.target.value)}
          />

          <input
            className="input"
            placeholder="العنوان"
            value={form.address_line}
            onChange={(e) => updateField("address_line", e.target.value)}
          />

          <input
            className="input"
            placeholder="المدينة"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />

          <input
            className="input"
            placeholder="الدولة"
            value={form.country}
            onChange={(e) => updateField("country", e.target.value)}
          />

          <input
            className="input"
            placeholder="اسم المفوض بالتوقيع"
            value={form.authorized_signatory_name}
            onChange={(e) =>
              updateField("authorized_signatory_name", e.target.value)
            }
          />

          <input
            className="input"
            placeholder="صفة المفوض بالتوقيع"
            value={form.authorized_signatory_title}
            onChange={(e) =>
              updateField("authorized_signatory_title", e.target.value)
            }
          />

          <textarea
            className="textarea"
            placeholder="ملاحظة تذييل التقرير"
            value={form.report_footer_note}
            onChange={(e) => updateField("report_footer_note", e.target.value)}
          />

          <textarea
            className="textarea"
            placeholder="ملاحظة الختم / الاعتماد"
            value={form.stamp_note}
            onChange={(e) => updateField("stamp_note", e.target.value)}
          />
        </div>

        {message ? (
          <div className="alert-success" style={{ marginTop: "14px" }}>
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="alert-error" style={{ marginTop: "14px" }}>
            {error}
          </div>
        ) : null}

        <div className="btn-row" style={{ marginTop: "14px" }}>
          <button className="btn btn-grow" onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ إعدادات العميل"}
          </button>
        </div>
      </div>
    </div>
  );
}
