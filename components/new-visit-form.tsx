"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  facilities: any[];
  buildings: any[];
  buildingSystems: any[];
  inspectors: any[];
};

export default function NewVisitForm({
  facilities,
  buildings,
  buildingSystems,
  inspectors,
}: Props) {
  const router = useRouter();

  const [facilityId, setFacilityId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [visitType, setVisitType] = useState("routine");
  const [plannedDate, setPlannedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedInspectorId, setAssignedInspectorId] = useState("");
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const filteredBuildings = useMemo(() => {
    return buildings.filter(
      (b) => String(b.facility_id || "") === String(facilityId)
    );
  }, [buildings, facilityId]);

  const filteredSystems = useMemo(() => {
    return buildingSystems.filter(
      (s) => String(s.building_id || "") === String(buildingId)
    );
  }, [buildingSystems, buildingId]);

  function toggleSystem(id: string) {
    setSelectedSystemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const selectedSystems = filteredSystems
      .filter((s) =>
        selectedSystemIds.includes(String(s.building_system_id || ""))
      )
      .map((s) => ({
        building_system_id: String(s.building_system_id || ""),
        system_code: String(s.system_code || ""),
      }))
      .filter((s) => s.building_system_id && s.system_code);

    if (!facilityId) return setMessage("اختر المنشأة أولًا.");
    if (!buildingId) return setMessage("اختر المبنى أولًا.");
    if (!plannedDate) return setMessage("حدد تاريخ الزيارة.");
    if (selectedSystems.length === 0)
      return setMessage("اختر نظامًا واحدًا على الأقل للفحص.");

    setBusy(true);

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facility_id: facilityId,
          building_id: buildingId,
          visit_type: visitType,
          planned_date: plannedDate,
          due_date: dueDate || plannedDate,
          assigned_inspector_id: assignedInspectorId,
          system_codes: selectedSystems.map((s) => s.system_code),
          systems: selectedSystems,
          notes,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || "فشل إنشاء الزيارة");
      }

      router.push(`/visits/${json.visitId}`);
      router.refresh();
    } catch (err: any) {
      setMessage(err.message || "حدث خطأ أثناء إنشاء الزيارة.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #dbe4ef",
    borderRadius: "16px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 800,
    color: "#334155",
    marginBottom: "6px",
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "14px" }}>
      <div>
        <label style={labelStyle}>المنشأة</label>
        <select
          value={facilityId}
          onChange={(e) => {
            setFacilityId(e.target.value);
            setBuildingId("");
            setSelectedSystemIds([]);
          }}
          style={inputStyle}
        >
          <option value="">اختر المنشأة</option>
          {facilities.map((f) => (
            <option key={String(f.facility_id)} value={String(f.facility_id)}>
              {String(f.facility_name || f.facility_name_ar || f.facility_id)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>المبنى</label>
        <select
          value={buildingId}
          onChange={(e) => {
            setBuildingId(e.target.value);
            setSelectedSystemIds([]);
          }}
          style={inputStyle}
          disabled={!facilityId}
        >
          <option value="">اختر المبنى</option>
          {filteredBuildings.map((b) => (
            <option key={String(b.building_id)} value={String(b.building_id)}>
              {String(b.building_name || b.building_name_ar || b.building_id)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>نوع الزيارة</label>
        <select
          value={visitType}
          onChange={(e) => setVisitType(e.target.value)}
          style={inputStyle}
        >
          <option value="routine">زيارة دورية</option>
          <option value="annual">زيارة سنوية</option>
          <option value="monthly">زيارة شهرية</option>
          <option value="corrective">زيارة تصحيحية</option>
          <option value="complaint">بلاغ / شكوى</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <div>
          <label style={labelStyle}>تاريخ الزيارة</label>
          <input
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>تاريخ الاستحقاق</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>المفتش المسؤول</label>
        <select
          value={assignedInspectorId}
          onChange={(e) => setAssignedInspectorId(e.target.value)}
          style={inputStyle}
        >
          <option value="">بدون تعيين حاليًا</option>
          {inspectors.map((i) => (
            <option
              key={String(i.inspector_id)}
              value={String(i.inspector_id)}
            >
              {String(i.inspector_name || i.name || i.email || i.inspector_id)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>الأنظمة المشمولة بالفحص</label>

        {!buildingId ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "14px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            اختر المبنى أولًا لعرض الأنظمة.
          </div>
        ) : filteredSystems.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "14px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            لا توجد أنظمة مرتبطة بهذا المبنى. أضف الأنظمة للمبنى أولًا.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {filteredSystems.map((s) => {
              const id = String(s.building_system_id || "");
              return (
                <label
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    border: "1px solid #dbe4ef",
                    borderRadius: "16px",
                    padding: "12px",
                    background: selectedSystemIds.includes(id)
                      ? "#ecfeff"
                      : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSystemIds.includes(id)}
                    onChange={() => toggleSystem(id)}
                  />
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>
                    {String(s.system_name_ar || s.system_name || s.system_code)}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>ملاحظات</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
          placeholder="أي ملاحظات قبل بدء الزيارة..."
        />
      </div>

      {message ? (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#991b1b",
            borderRadius: "16px",
            padding: "12px",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        style={{
          border: 0,
          borderRadius: "18px",
          padding: "14px",
          fontSize: "15px",
          fontWeight: 900,
          color: "#fff",
          background: busy ? "#94a3b8" : "#0f766e",
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "جاري الحفظ..." : "إنشاء الزيارة"}
      </button>
    </form>
  );
}
