"use client";

import { useRef, useState } from "react";

type EvidenceRow = {
  evidence_id: string;
  visit_id: string;
  visit_system_id: string;
  checklist_item_id: string;
  asset_id?: string;
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
  assetId?: string;
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
    u.includes("blob.vercel-storage.com")
  );
}

function inferEvidenceType(file: File) {
  if (file.type.startsWith("image/")) return "image";
  if (
    file.type.includes("pdf") ||
    file.type.includes("word") ||
    file.type.includes("document") ||
    file.type.includes("sheet") ||
    file.type.includes("excel")
  ) {
    return "document";
  }
  return "other";
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || "استجابة غير مفهومة من الخادم");
  }
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const imageBitmap = await createImageBitmap(file);

  let width = imageBitmap.width;
  let height = imageBitmap.height;

  const maxSide = 1600;

  if (width > height && width > maxSide) {
    height = Math.round((height * maxSide) / width);
    width = maxSide;
  } else if (height >= width && height > maxSide) {
    width = Math.round((width * maxSide) / height);
    height = maxSide;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  let quality = 0.82;
  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );

  while (blob && blob.size > 3.8 * 1024 * 1024 && quality > 0.45) {
    quality -= 0.08;
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
  }

  if (!blob) return file;

  const safeName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], safeName, { type: "image/jpeg" });
}

export default function ChecklistItemEvidence({
  visitId,
  visitSystemId,
  checklistItemId,
  assetId = "",
  rows,
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localRows, setLocalRows] = useState<EvidenceRow[]>(rows);

  function handleSelectFile(file: File | null) {
    setMessage("");
    setError("");
    if (!file) return;
    setSelectedFile(file);
  }

  async function handleSave() {
    setMessage("");
    setError("");

    if (!selectedFile) {
      setError("اختر صورة أو ملف أولًا");
      return;
    }

    try {
      setSaving(true);

      const preparedFile = await compressImage(selectedFile);

      if (preparedFile.size > 4.2 * 1024 * 1024) {
        throw new Error("الملف ما زال كبيرًا جدًا بعد الضغط. اختر صورة أصغر.");
      }

      const uploadForm = new FormData();
      uploadForm.append("file", preparedFile);

      const uploadRes = await fetch("/api/evidence/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await parseJsonSafe(uploadRes);

      if (!uploadRes.ok || !uploadData.ok) {
        throw new Error(uploadData.message || "تعذر رفع الملف");
      }

      const evidenceType = inferEvidenceType(preparedFile);

      const saveRes = await fetch("/api/evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_id: visitId,
          visit_system_id: visitSystemId,
          checklist_item_id: checklistItemId,
          asset_id: assetId,
          evidence_type: evidenceType,
          file_url: String(uploadData.data?.file_url || ""),
          file_name: String(uploadData.data?.file_name || preparedFile.name || ""),
          caption,
        }),
      });

      const saveData = await parseJsonSafe(saveRes);

      if (!saveRes.ok || !saveData.ok) {
        throw new Error(saveData.message || "تعذر حفظ الدليل");
      }

      const now = new Date().toISOString();

      setLocalRows((prev) => [
        {
          evidence_id: String(saveData.data?.evidence_id || ""),
          visit_id: visitId,
          visit_system_id: visitSystemId,
          checklist_item_id: checklistItemId,
          asset_id: assetId,
          evidence_type: evidenceType,
          file_url: String(uploadData.data?.file_url || ""),
          file_name: String(uploadData.data?.file_name || preparedFile.name || ""),
          caption,
          taken_by: "",
          taken_at: now,
        },
        ...prev,
      ]);

      setSelectedFile(null);
      setCaption("");
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";

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
        التقط صورة أو اختر ملفًا لهذا البند مباشرة
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleSelectFile(e.target.files?.[0] || null)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
        style={{ display: "none" }}
        onChange={(e) => handleSelectFile(e.target.files?.[0] || null)}
      />

      <div className="btn-row" style={{ marginTop: "12px" }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => cameraInputRef.current?.click()}
        >
          التقاط صورة
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          اختيار ملف
        </button>
      </div>

      {selectedFile ? (
        <div
          style={{
            marginTop: "12px",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "12px",
            background: "#fff",
          }}
        >
          <div className="section-subtitle">
            الملف المحدد: {selectedFile.name}
          </div>
          <div className="section-subtitle" style={{ marginTop: "6px" }}>
            الحجم: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      ) : null}

      <textarea
        className="field"
        placeholder="ملاحظة مختصرة على الدليل"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ marginTop: "12px" }}
      />

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

      <div className="btn-row" style={{ marginTop: "12px" }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "جارٍ الرفع..." : "حفظ دليل هذا البند"}
        </button>
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
