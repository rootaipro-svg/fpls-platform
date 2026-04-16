"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  findingId: string;
  currentStatus: string;
  currentNotes?: string;
};

export default function CloseFindingForm({
  findingId,
  currentStatus,
  currentNotes = "",
}: Props) {
  const router = useRouter();
  const isClosed = String(currentStatus || "").toLowerCase() === "closed";

  const [verificationNotes, setVerificationNotes] = useState(currentNotes);
  const [actualCloseDate, setActualCloseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleClose() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/findings/${findingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          closure_status: "closed",
          verification_notes: verificationNotes,
          actual_close_date: actualCloseDate,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر تحديث المخالفة");
      }

      setMessage("تم إغلاق المخالفة بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تحديث المخالفة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="action-panel">
      <div className="action-panel-title">إغلاق المخالفة</div>
      <div className="action-panel-text">
        سجل ملاحظات التحقق وتاريخ الإغلاق ثم أغلق المخالفة
      </div>

      {isClosed ? (
        <div className="alert-success" style={{ marginTop: "14px" }}>
          هذه المخالفة مغلقة بالفعل
        </div>
      ) : (
        <>
          <textarea
            className="field"
            style={{ marginTop: "14px" }}
            placeholder="ملاحظات التحقق"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
          />

          <div style={{ marginTop: "12px" }}>
            <div className="helper-text" style={{ marginBottom: "6px" }}>
              تاريخ الإغلاق الفعلي
            </div>
            <input
              type="date"
              className="field"
              value={actualCloseDate}
              onChange={(e) => setActualCloseDate(e.target.value)}
            />
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

          <div className="btn-row" style={{ marginTop: "14px" }}>
            <button
              type="button"
              className="btn btn-grow"
              disabled={saving}
              onClick={handleClose}
            >
              {saving ? "جارٍ الإغلاق..." : "إغلاق المخالفة"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
