"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InspectorOption = {
  inspector_id: string;
  inspector_name: string;
};

type Props = {
  assetId: string;
  className?: string;
  label?: string;
};

export default function CreateAssetVisitButton({
  assetId,
  className = "btn",
  label = "إنشاء زيارة لهذا الأصل",
}: Props) {
  const router = useRouter();

  const [inspectors, setInspectors] = useState<InspectorOption[]>([]);
  const [selectedInspectorId, setSelectedInspectorId] = useState("");
  const [loadingInspectors, setLoadingInspectors] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadInspectors() {
      try {
        setLoadingInspectors(true);
        setError("");

        const res = await fetch(`/api/assets/${assetId}/eligible-inspectors`, {
          method: "GET",
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "تعذر تحميل المفتشين");
        }

        const rows: InspectorOption[] = Array.isArray(data.inspectors)
          ? data.inspectors
          : [];

        if (!mounted) return;

        setInspectors(rows);
        setSelectedInspectorId(rows[0]?.inspector_id || "");
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "تعذر تحميل المفتشين");
      } finally {
        if (mounted) {
          setLoadingInspectors(false);
        }
      }
    }

    loadInspectors();

    return () => {
      mounted = false;
    };
  }, [assetId]);

  async function handleCreate() {
    try {
      setCreating(true);
      setError("");

      if (!selectedInspectorId) {
        throw new Error("اختر المفتش أولًا");
      }

      const res = await fetch(`/api/assets/${assetId}/create-visit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigned_inspector_id: selectedInspectorId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إنشاء الزيارة");
      }

      router.push(
        `/visits/${String(data.visit_id)}?asset_id=${encodeURIComponent(assetId)}`
      );
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إنشاء الزيارة");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="stack-3" style={{ width: "100%" }}>
      {loadingInspectors ? (
        <div className="muted-note">جارٍ تحميل المفتشين المؤهلين...</div>
      ) : inspectors.length === 0 ? (
        <div className="alert-error">
          لا يوجد مفتشون مؤهلون لهذا النظام حاليًا. أضف مفتشًا active واربطه
          بالنظام داخل INSPECTORS.
        </div>
      ) : (
        <>
          <select
            className="field"
            value={selectedInspectorId}
            onChange={(e) => setSelectedInspectorId(e.target.value)}
          >
            {inspectors.map((inspector) => (
              <option
                key={inspector.inspector_id}
                value={inspector.inspector_id}
              >
                {inspector.inspector_name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={className}
            onClick={handleCreate}
            disabled={creating || !selectedInspectorId}
          >
            {creating ? "جارٍ إنشاء الزيارة..." : label}
          </button>
        </>
      )}

      {error ? <div className="alert-error">{error}</div> : null}
    </div>
  );
}
