"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type Props = {
  facilities: any[];
  buildings: any[];
  buildingSystems: any[];
  systemsRef: any[];
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

function makeSystemRefMap(systemsRef: any[]) {
  const map = new Map<string, any>();

  for (const row of systemsRef || []) {
    const code = String(row.system_code || "").trim();
    if (code && !map.has(code)) {
      map.set(code, row);
    }
  }

  return map;
}

function getSystemLabels(system: any, systemRefByCode: Map<string, any>) {
  const code = String(system?.system_code || "").trim();
  const ref = systemRefByCode.get(code);

  const ar = text(
    system?.system_name_override ||
      ref?.system_name_ar ||
      ref?.system_display_name_ar ||
      system?.system_name_ar ||
      system?.system_display_name_ar,
    ""
  );

  const en = text(
    ref?.system_name ||
      ref?.system_display_name ||
      system?.system_name ||
      system?.system_display_name,
    ""
  );

  const standard = text(ref?.related_standard || system?.standard_profile, "");

  return {
    ar: ar || en || code || "نظام",
    en,
    code,
    standard,
  };
}

function getInspectorName(inspector: any) {
  return text(
    inspector?.full_name_ar ||
      inspector?.full_name ||
      inspector?.inspector_name ||
      inspector?.name ||
      inspector?.email,
    text(inspector?.inspector_id, "مفتش")
  );
}

function inputStyle(): CSSProperties {
  return {
    width: "100%",
    border: "1px solid #dbe4ef",
    borderRadius: "16px",
    padding: "12px 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  };
}

function labelStyle(): CSSProperties {
  return {
    display: "block",
    fontSize: "13px",
    fontWeight: 900,
    color: "#334155",
    marginBottom: "6px",
  };
}

function infoCardStyle(): CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
    background: "#fff",
  };
}

function selectedCardStyle(): CSSProperties {
  return {
    border: "1px solid #99f6e4",
    background: "#ecfeff",
    borderRadius: "22px",
    padding: "14px",
  };
}

export default function NewVisitForm({
  facilities,
  buildings,
  buildingSystems,
  systemsRef,
  inspectors,
  initialBuildingSystemId = "",
}: Props) {
  const router = useRouter();

  const systemRefByCode = useMemo(
    () => makeSystemRefMap(systemsRef),
    [systemsRef]
  );

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

  const openedFromSystem = Boolean(initialBuildingSystemId && initialSystem);

  const [facilityId, setFacilityId] = useState(initialFacilityId);
  const [buildingId, setBuildingId] = useState(initialBuildingId);
  const [visitType, setVisitType] = useState("routine");
  const [plannedDate, setPlannedDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState(todayIso());
  const [assignedInspectorId, setAssignedInspectorId] = useState("");
  const [selectedSystemIds, setSelectedSystemIds] = useState(
    initialSelectedSystems
  );
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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

  const selectedInitialLabels = initialSystem
    ? getSystemLabels(initialSystem, systemRefByCode)
    : null;

  function toggleSystem(id: string) {
    if (openedFromSystem) return;

    setSelectedSystemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(e: FormEvent) {
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

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: "14px",
      }}
    >
      {openedFromSystem && initialSystem ? (
        <div style={selectedCardStyle()}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "20px",
                background: "#fff",
                border: "1px solid #ccfbf1",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={28} color="#0f766e" />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#0f766e",
                  fontWeight: 900,
                }}
              >
                النظام محدد من صفحة النظام / QR
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "19px",
                  fontWeight: 950,
                  color: "#0f172a",
                  lineHeight: 1.5,
                }}
              >
                {selectedInitialLabels?.ar}
              </div>

              {selectedInitialLabels?.en ? (
                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedInitialLabels.en}
                </div>
              ) : null}

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color: "#64748b",
                  lineHeight: 1.7,
                }}
              >
                {selectedInitialLabels?.code}
                {selectedInitialLabels?.standard
                  ? ` · ${selectedInitialLabels.standard}`
                  : ""}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
              marginTop: "12px",
            }}
          >
            <div style={infoCardStyle()}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                المنشأة
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {getFacilityName(selectedFacility)}
              </div>
            </div>

            <div style={infoCardStyle()}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                المبنى
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {getBuildingName(selectedBuilding)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!openedFromSystem ? (
        <>
          <div>
            <label style={labelStyle()}>المنشأة</label>
            <select
              value={facilityId}
              onChange={(e) => {
                setFacilityId(e.target.value);
                setBuildingId("");
                setSelectedSystemIds([]);
              }}
              style={inputStyle()}
            >
              <option value="">اختر المنشأة</option>
              {facilities.map((facility) => (
                <option
                  key={String(facility.facility_id || "")}
                  value={String(facility.facility_id || "")}
                >
                  {getFacilityName(facility)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle()}>المبنى</label>
            <select
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value);
                setSelectedSystemIds([]);
              }}
              style={inputStyle()}
              disabled={!facilityId}
            >
              <option value="">اختر المبنى</option>
              {filteredBuildings.map((building) => (
                <option
                  key={String(building.building_id || "")}
                  value={String(building.building_id || "")}
                >
                  {getBuildingName(building)}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <div>
          <label style={labelStyle()}>نوع الزيارة</label>
          <select
            value={visitType}
            onChange={(e) => setVisitType(e.target.value)}
            style={inputStyle()}
          >
            <option value="routine">زيارة دورية</option>
            <option value="monthly">زيارة شهرية</option>
            <option value="annual">زيارة سنوية</option>
            <option value="reinspection">إعادة فحص</option>
            <option value="complaint">بلاغ / شكوى</option>
            <option value="handover">تسليم واستلام</option>
          </select>
        </div>

        <div>
          <label style={labelStyle()}>المفتش المسؤول</label>
          <select
            value={assignedInspectorId}
            onChange={(e) => setAssignedInspectorId(e.target.value)}
            style={inputStyle()}
          >
            <option value="">بدون تعيين حاليًا</option>
            {inspectors.map((inspector) => (
              <option
                key={String(inspector.inspector_id || "")}
                value={String(inspector.inspector_id || "")}
              >
                {getInspectorName(inspector)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle()}>تاريخ الزيارة</label>
          <input
            type="date"
            value={plannedDate}
            onChange={(e) => setPlannedDate(e.target.value)}
            style={inputStyle()}
          />
        </div>

        <div>
          <label style={labelStyle()}>تاريخ الاستحقاق</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={inputStyle()}
          />
        </div>
      </div>

      {!openedFromSystem ? (
        <div>
          <label style={labelStyle()}>الأنظمة المشمولة بالفحص</label>

          {!buildingId ? (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: "18px",
                padding: "14px",
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.8,
              }}
            >
              اختر المبنى أولًا لعرض الأنظمة.
            </div>
          ) : filteredSystems.length === 0 ? (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: "18px",
                padding: "14px",
                color: "#64748b",
                fontSize: "13px",
                lineHeight: 1.8,
              }}
            >
              لا توجد أنظمة مرتبطة بهذا المبنى. أضف الأنظمة للمبنى أولًا.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {filteredSystems.map((system) => {
                const id = String(system.building_system_id || "");
                const active = selectedSystemIds.includes(id);
                const labels = getSystemLabels(system, systemRefByCode);

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
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 900,
                          color: "#0f172a",
                          lineHeight: 1.6,
                        }}
                      >
                        {labels.ar}
                      </div>

                      {labels.en ? (
                        <div
                          style={{
                            marginTop: "2px",
                            fontSize: "12px",
                            color: "#64748b",
                            lineHeight: 1.5,
                          }}
                        >
                          {labels.en}
                        </div>
                      ) : null}

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "12px",
                          color: "#94a3b8",
                        }}
                      >
                        {labels.code}
                        {labels.standard ? ` · ${labels.standard}` : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        border: active
                          ? "7px solid #0f766e"
                          : "2px solid #cbd5e1",
                        background: "#fff",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <div>
        <label style={labelStyle()}>ملاحظات قبل بدء الزيارة</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            ...inputStyle(),
            minHeight: "90px",
            resize: "vertical",
          }}
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
            fontWeight: 800,
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
          padding: "15px",
          fontSize: "15px",
          fontWeight: 950,
          color: "#fff",
          background: busy ? "#94a3b8" : "#0f766e",
          cursor: busy ? "not-allowed" : "pointer",
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          minHeight: "54px",
        }}
      >
        {busy ? (
          <>
            <CalendarDays size={19} />
            جارٍ إنشاء الزيارة...
          </>
        ) : openedFromSystem ? (
          <>
            <ClipboardList size={19} />
            إنشاء زيارة فحص لهذا النظام
          </>
        ) : (
          <>
            <CheckCircle2 size={19} />
            إنشاء الزيارة وبدء الفحص
          </>
        )}
      </button>
    </form>
  );
}
