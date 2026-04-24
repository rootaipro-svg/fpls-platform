"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  facilities: any[];
  buildings: any[];
  buildingSystems: any[];
  inspectors: any[];
  initialBuildingSystemId?: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function text(value: unknown, fallback = "") {
  const output = String(value ?? "").trim();
  return output || fallback;
}

function getFacilityName(facility: any) {
  return text(
    facility?.facility_name_ar || facility?.facility_name || facility?.name,
    text(facility?.facility_id, "منشأة")
  );
}

function getBuildingName(building: any) {
  return text(
    building?.building_name_ar || building?.building_name || building?.name,
    text(building?.building_id, "مبنى")
  );
}

function getSystemName(system: any) {
  return text(
    system?.system_name_override ||
      system?.system_display_name_ar ||
      system?.system_display_name ||
      system?.system_name_ar ||
      system?.system_name,
    text(system?.system_code, "نظام")
  );
}

export default function NewVisitForm({
  facilities,
  buildings,
  buildingSystems,
  inspectors,
  initialBuildingSystemId = "",
}: Props) {
  const router = useRouter();

  const initialSystem = buildingSystems.find(
    (system) =>
      String(system.building_system_id || "") ===
      String(initialBuildingSystemId || "")
  );

  const initialBuilding = initialSystem
    ? buildings.find(
        (building) =>
          String(building.building_id || "") ===
          String(initialSystem.building_id || "")
      )
    : null;

  const initialFacilityId = initialBuilding
    ? String(initialBuilding.facility_id || "")
    : "";

  const initialBuildingId = initialSystem
    ? String(initialSystem.building_id || "")
    : "";

  const initialSelectedSystems = initialSystem
    ? [String(initialSystem.building_system_id || "")]
    : [];

  const [facilityId, setFacilityId] = useState(initialFacilityId);
  const [buildingId, setBuildingId] = useState(initialBuildingId);
  const [visitType, setVisitType] = useState("routine");
  const [plannedDate, setPlannedDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(todayIso());
  const [assignedInspectorId, setAssignedInspectorId] = useState("");
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>(
    initialSelectedSystems
  );
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const openedFromQr = Boolean(initialBuildingSystemId && initialSystem);

  const selectedFacility = facilities.find(
    (facility) => String(facility.facility_id || "") === String(facilityId)
  );

  const selectedBuilding = buildings.find(
    (building) => String(building.building_id || "") === String(buildingId)
  );

  const filteredBuildings = useMemo(() => {
    return buildings.filter(
      (building) => String(building.facility_id || "") === String(facilityId)
    );
  }, [buildings, facilityId]);

  const filteredSystems = useMemo(() => {
    return buildingSystems.filter(
      (system) => String(system.building_id || "") === String(buildingId)
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
      .filter((system) =>
        selectedSystemIds.includes(String(system.building_system_id || ""))
      )
      .map((system) => ({
        building_system_id: String(system.building_system_id || ""),
        system_code: String(system.system_code || ""),
      }))
      .filter((system) => system.building_system_id && system.system_code);

    if (!facilityId) return setMessage("اختر المنشأة أولًا.");
    if (!buildingId) return setMessage("اختر المبنى أولًا.");
    if (!plannedDate) return setMessage("حدد تاريخ الزيارة.");
    if (selectedSystems.length === 0) {
      return setMessage("اختر نظامًا واحدًا على الأقل للفحص.");
    }

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
          system_codes: selectedSystems.map((system) => system.system_code),
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

  const readonlyCardStyle: React.CSSProperties = {
    border: "1px solid #ccfbf1",
    background: "#ecfeff",
    borderRadius: "18px",
    padding: "12px",
    color: "#0f766e",
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.8,
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "14px" }}>
      {openedFromQr ? (
        <div style={readonlyCardStyle}>
          تم تحديد النظام من QR.
          <br />
          المنشأة: {getFacilityName(selectedFacility)}
          <br />
          المبنى: {getBuildingName(selectedBuilding)}
          <br />
          النظام: {getSystemName(initialSystem)}
        </div>
      ) : null}

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
          {facilities.map((facility) => (
            <option
              key={String(facility.facility_id)}
              value={String(facility.facility_id)}
            >
              {getFacilityName(facility)}
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
          {filteredBuildings.map((building) => (
            <option
              key={String(building.building_id)}
              value={String(building.building_id)}
            >
              {getBuildingName(building)}
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
          {inspectors.map((inspector) => (
            <option
              key={String(inspector.inspector_id)}
              value={String(inspector.inspector_id)}
            >
              {String(
                inspector.inspector_name ||
                  inspector.name ||
                  inspector.email ||
                  inspector.inspector_id
              )}
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
            {filteredSystems.map((system) => {
              const id = String(system.building_system_id || "");
              const active = selectedSystemIds.includes(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSystem(id)}
                  style={{
                    textAlign: "right",
                    border: active
                      ? "1px solid #99f6e4"
                      : "1px solid #dbe4ef",
                    borderRadius: "18px",
                    padding: "12px",
                    background: active ? "#ecfeff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 900,
                        color: active ? "#0f766e" : "#0f172a",
                        lineHeight: 1.6,
                      }}
                    >
                      {getSystemName(system)}
                    </span>

                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: active
                          ? "6px solid #0f766e"
                          : "2px solid #cbd5e1",
                        background: "#fff",
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    {String(system.system_code || "")}
                  </div>
                </button>
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
            lineHeight: 1.8,
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
        {busy ? "جاري إنشاء الزيارة..." : "إنشاء الزيارة وبدء الفحص"}
      </button>
    </form>
  );
}
