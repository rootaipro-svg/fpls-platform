"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/assets/${assetId}/create-visit`, {
        method: "POST",
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
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={className}
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? "جارٍ إنشاء الزيارة..." : label}
      </button>

      {error ? (
        <div className="alert-error" style={{ marginTop: "10px" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
