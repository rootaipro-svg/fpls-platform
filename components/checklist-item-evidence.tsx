"use client";

import { useMemo, useState } from "react";

type EvidenceRow = {
  evidence_id: string;
  visit_id: string;
  visit_system_id: string;
  checklist_item_id: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  caption: string;
  taken_by: string;
  taken_at: string;
};

type Props = {
  visitId: string;
  visitSystemId: string;
  checklistItemId: string;
  rows: EvidenceRow[];
};

function looksLikeImage(url: string, evidenceType: string) {
  const u = String(url || "").toLowerCase();
  if (String(evidenceType || "").toLowerCase() === "image") return true;

  return (
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".png") ||
    u.endsWith(".webp") ||
    u.includes("googleusercontent.com")
  );
}

export default function ChecklistItemEvidence({
  visitId,
  visitSystemId,
  checklistItemId,
  rows,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [localRows, setLocalRows] = useState<EvidenceRow[]>(rows);

  const [form, setForm] = useState({
    evidence_type: "image",
    file_url: "",
    file_name: "",
    caption: "",
    taken_by: "",
    taken_at: "",
  });

  const total = useMemo(() => localRows.length, [localRows]);

  function updateField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_id: visitId,
          visit_system_id: visitSystemId,
          checklist_item_id: checklistItemId,
          evidence_type: form.evidence_type,
          file_url: form.file_url,
          file_name: form.file_name,
          caption: form.caption,
          taken_by: form.taken_by,
          taken_at: form.taken_at,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ الدليل");
      }

      const newRow: EvidenceRow = {
        evidence_id: String(data.data?.evidence_id || ""),
        visit_id: visitId,
        visit_system_id: visitSystemId,
        checklist_item_id: checklistItemId,
        evidence_type: form.evidence_type,
        file_url: form.file_url,
        file_name: form.file_name,
        caption: form.caption,
        taken_by: form.taken_by,
        taken_at: form.taken_at,
      };

      setLocalRows((prev) => [newRow, ...prev]);
      setForm({
        evidence_type: "image",
        file_url: "",
        file_name: "",
        caption: "",
        taken_by: "",
        taken_at: "",
      });
      setMessage("تم حفظ دليل هذا البند");
    } catch (err: any) {
      setError(err.message || "تعذر حفظ الدليل");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "12px",
        border: "1px dashed #cbd5e1",
        borderRadius: "18px",
        padding: "14px",
        background: "#f8fafc",
      }}
    >
      <div className="section-title" style={{ fontSize: "15px" }}>
        أدلة البند
      </div>

      <div className="section-subtitle" style={{ marginTop: "4px" }}>
        أضف صورة أو مستند لهذا البند مباشرة
        {total > 0 ? ` · المسجل: ${total}` : ""}
      </div>

      <div className="stack-3" style={{ marginTop: "12px" }}>
        <select
          className="field"
          value={form.evidence_type}
          onChange={(e) => updateField("evidence_type", e.target.value)}
        >
          <option value="image">صورة</option>
          <option value="document">مستند</option>
          <option value="other">أخرى</option>
        </select>

        <input
          className="field"
          placeholder="رابط الصورة أو الملف"
          value={form.file_url}
          onChange={(e) => updateField("file_url", e.target.value)}
        />

        <input
          className="field"
          placeholder="اسم الملف أو الوصف المختصر"
          value={form.file_name}
          onChange={(e) => updateField("file_name", e.target.value)}
        />

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
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ دليل هذا البند"}
          </button>
        </div>
      </div>

      {localRows.length > 0 ? (
        <div className="stack-3" style={{ marginTop: "14px" }}>
          {localRows.map((row) => (
            <div
              key={row.evidence_id || `${row.file_url}-${row.taken_at}`}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "12px",
                background: "#ffffff",
              }}
            >
              <div className="badge-wrap">
                <span className="badge">{row.evidence_type || "evidence"}</span>
                {row.file_name ? <span className="badge">{row.file_name}</span> : null}
              </div>

              {looksLikeImage(row.file_url, row.evidence_type) ? (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={row.file_url}
                    alt={row.file_name || "Evidence"}
                    style={{
                      width: "100%",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </div>
              ) : null}

              {row.caption ? (
                <div className="visit-card-text" style={{ marginTop: "10px" }}>
                  {row.caption}
                </div>
              ) : null}

              <div className="section-subtitle" style={{ marginTop: "8px" }}>
                {row.taken_by || "غير محدد"}
                {row.taken_at ? ` · ${row.taken_at}` : ""}
              </div>

              <div style={{ marginTop: "10px" }}>
                <a
                  href={row.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  فتح الدليل
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
