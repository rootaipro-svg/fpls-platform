"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type InspectorOption = {
  inspector_id: string;
  inspector_name: string;
};

type VisitCardRow = {
  visit_id: string;
  visit_type: string;
  planned_date: string;
  facility_name: string;
  building_name: string;
  system_codes: string[];
  inspectors: InspectorOption[];
};

type Props = {
  visits: VisitCardRow[];
};

export default function AssignVisitInspectorForm({ visits }: Props) {
  const router = useRouter();
  const [selectedByVisit, setSelectedByVisit] = useState<Record<string, string>>(
    Object.fromEntries(
      visits.map((visit) => [visit.visit_id, visit.inspectors[0]?.inspector_id || ""])
    )
  );
  const [loadingVisitId, setLoadingVisitId] = useState("");
  const [errorByVisit, setErrorByVisit] = useState<Record<string, string>>({});

  async function assignVisit(visitId: string) {
    try {
      const inspectorId = String(selectedByVisit[visitId] || "");
      if (!inspectorId) {
        setErrorByVisit((prev) => ({
          ...prev,
          [visitId]: "اختر المفتش أولًا",
        }));
        return;
      }

      setLoadingVisitId(visitId);
      setErrorByVisit((prev) => ({ ...prev, [visitId]: "" }));

      const res = await fetch(`/api/visits/${visitId}/assign-inspector`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigned_inspector_id: inspectorId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إسناد الزيارة");
      }

      router.refresh();
    } catch (err: any) {
      setErrorByVisit((prev) => ({
        ...prev,
        [visitId]: err.message || "تعذر إسناد الزيارة",
      }));
    } finally {
      setLoadingVisitId("");
    }
  }

  return (
    <div className="stack-3">
      {visits.map((visit) => (
        <section key={visit.visit_id} className="card">
          <div className="section-header-row">
            <div>
              <div className="section-title">
                {visit.visit_type || "زيارة"} · {visit.visit_id}
              </div>
              <div className="section-subtitle">
                {visit.facility_name || "-"}
                {visit.building_name ? ` · ${visit.building_name}` : ""}
                {visit.planned_date ? ` · ${visit.planned_date}` : ""}
              </div>
            </div>

            <div className="badge-wrap">
              {visit.system_codes.map((code) => (
                <span key={`${visit.visit_id}-${code}`} className="badge">
                  {code}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "14px" }}>
            {visit.inspectors.length === 0 ? (
              <div className="alert-error">
                لا يوجد مفتش active مؤهل لكل الأنظمة المرتبطة بهذه الزيارة.
              </div>
            ) : (
              <div className="stack-3">
                <select
                  className="field"
                  value={selectedByVisit[visit.visit_id] || ""}
                  onChange={(e) =>
                    setSelectedByVisit((prev) => ({
                      ...prev,
                      [visit.visit_id]: e.target.value,
                    }))
                  }
                >
                  {visit.inspectors.map((inspector) => (
                    <option
                      key={`${visit.visit_id}-${inspector.inspector_id}`}
                      value={inspector.inspector_id}
                    >
                      {inspector.inspector_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="btn"
                  disabled={loadingVisitId === visit.visit_id}
                  onClick={() => assignVisit(visit.visit_id)}
                >
                  {loadingVisitId === visit.visit_id
                    ? "جارٍ الإسناد..."
                    : "إسناد سريع"}
                </button>
              </div>
            )}

            {errorByVisit[visit.visit_id] ? (
              <div className="alert-error" style={{ marginTop: "10px" }}>
                {errorByVisit[visit.visit_id]}
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
