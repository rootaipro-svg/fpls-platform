"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateFollowupButton({
  buildingSystemId,
  nextDueDate,
}: {
  buildingSystemId: string;
  nextDueDate: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleCreate() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/due/create-followup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          building_system_id: buildingSystemId,
          planned_date: nextDueDate || new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إنشاء زيارة المتابعة");
      }

      setMessage("تم إنشاء زيارة متابعة");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إنشاء زيارة المتابعة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="due-card-actions">
      <button
        type="button"
        className="btn btn-block"
        onClick={handleCreate}
        disabled={saving}
      >
        {saving ? "جارٍ الإنشاء..." : "إنشاء زيارة متابعة"}
      </button>

      {message ? <div className="alert-success" style={{ marginTop: "10px" }}>{message}</div> : null}
      {error ? <div className="alert-error" style={{ marginTop: "10px" }}>{error}</div> : null}
    </div>
  );
}
