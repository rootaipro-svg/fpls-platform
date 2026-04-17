"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SystemOption = {
  visit_system_id: string;
  system_code: string;
};

type FindingOption = {
  finding_id: string;
  title: string;
};

type Props = {
  visitId: string;
  systems: SystemOption[];
  findings: FindingOption[];
};

export default function VisitEvidenceForm({
  visitId,
  systems,
  findings,
}: Props) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    visit_id: visitId,
    visit_system_id: "",
    finding_id: "",
    evidence_type: "image",
    file_url: "",
    file_name: "",
    caption: "",
    taken_by: "",
    taken_at: "",
  });

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ الدليل");
      }

      setMessage("تم حفظ الدليل بنجاح");
      setForm({
        visit_id: visitId,
        visit_system_id: "",
        finding_id: "",
        evidence_type: "image",
        file_url: "",
        file_name: "",
        caption: "",
        taken_by: "",
        taken_at: "",
      });

      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ الدليل");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">إضافة دليل / صورة / ملف</div>
      <div className="section-subtitle">
        في هذه المرحلة أضف رابط الصورة أو الملف، والرفع المباشر سنفعله في الدفعة التالية.
      </div>

      <form onSubmit={handleSubmit} className="stack-3" style={{ marginTop: "14px" }}>
        <select
          className="field"
          value={form.evidence_type}
          onChange={(e) => updateField("evidence_type", e.target.value)}
        >
          <option value="image">صورة</option>
          <option value="document">مستند</option>
          <option value="video">فيديو</option>
          <option value="other">أخرى</option>
        </select>

        <input
          className="field"
          placeholder="رابط الصورة أو الملف *"
          value={form.file_url}
          onChange={(e) => updateField("file_url", e.target.value)}
        />

        <input
          className="field"
          placeholder="اسم الملف أو الوصف المختصر"
          value={form.file_name}
          onChange={(e) => updateField("file_name", e.target.value)}
        />

        <select
          className="field"
          value={form.visit_system_id}
          onChange={(e) => updateField("visit_system_id", e.target.value)}
        >
          <option value="">ربط اختياري بنظام داخل الزيارة</option>
          {systems.map((system) => (
            <option key={system.visit_system_id} value={system.visit_system_id}>
              {system.system_code}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={form.finding_id}
          onChange={(e) => updateField("finding_id", e.target.value)}
        >
          <option value="">ربط اختياري بمخالفة</option>
          {findings.map((finding) => (
            <option key={finding.finding_id} value={finding.finding_id}>
              {finding.title}
            </option>
          ))}
        </select>

        <textarea
          className="field"
          placeholder="شرح الدليل أو الملاحظة"
          value={form.caption}
          onChange={(e) => updateField("caption", e.target.value)}
        />

        <input
          className="field"
          placeholder="اسم من التقط الدليل"
          value={form.taken_by}
          onChange={(e) => updateField("taken_by", e.target.value)}
        />

        <input
          className="field"
          type="datetime-local"
          value={form.taken_at}
          onChange={(e) => updateField("taken_at", e.target.value)}
        />

        {message ? <div className="alert-success">{message}</div> : null}
        {error ? <div className="alert-error">{error}</div> : null}

        <div className="btn-row">
          <button type="submit" className="btn btn-grow" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ الدليل"}
          </button>
        </div>
      </form>
    </div>
  );
}
