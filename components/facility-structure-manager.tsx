"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Layers3,
  Pencil,
  Plus,
  QrCode,
  Save,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { safeText, toSystemLabel } from "@/lib/display";

type Props = {
  facility: any;
  buildings: any[];
  systems: any[];
  systemsRef?: any[];
};

type Mode = "none" | "edit-facility" | "add-building" | "manage-buildings";
type WizardStep = 1 | 2 | 3;

type SelectedSystemDraft = {
  system_code: string;
  system_name_override: string;
  coverage_scope: string;
  protection_area: string;
  standard_profile: string;
  system_status: string;
  qr_enabled: string;
};

function text(value: any) {
  return String(value ?? "");
}

function isEnabledSystem(system: any) {
  const value = String(
    system.enabled ?? system.active_status ?? system.status ?? "TRUE"
  )
    .trim()
    .toLowerCase();

  return !["false", "0", "no", "disabled", "inactive", "archived"].includes(
    value
  );
}

function systemArabicName(system: any) {
  return safeText(system?.system_name_ar || system?.system_display_name_ar, "");
}

function systemEnglishName(system: any) {
  return safeText(system?.system_name || system?.system_display_name, "");
}

function systemOptionLabel(system: any) {
  const ar = systemArabicName(system);
  const en = systemEnglishName(system);
  const code = safeText(system?.system_code, "SYSTEM");

  if (ar && en) return `${ar} (${en})`;
  if (ar) return ar;
  if (en) return en;

  return code;
}

function defaultNewBuilding(facilityId: string) {
  return {
    facility_id: facilityId,
    building_code: "",
    building_name: "",
    building_name_ar: "",
    building_use: "",
    construction_type: "",
    number_of_floors: "",
    basement_count: "",
    building_height_m: "",
    area_m2: "",
    occupancy_profile_id: "",
    risk_profile_id: "",
    year_built: "",
    last_major_renovation_year: "",
    civil_defense_permit_no: "",
    evacuation_strategy: "",
    status: "active",
    notes: "",
  };
}

function defaultNewSystem(buildingId: string) {
  return {
    building_id: buildingId,
    system_instance_code: "",
    system_code: "",
    system_name_override: "",
    coverage_scope: "",
    protection_area: "",
    standard_profile: "",
    authority_profile_id: "",
    manufacturer: "",
    model: "",
    serial_no: "",
    install_date: "",
    commission_date: "",
    service_provider: "",
    approval_lab_code: "",
    criticality_class: "",
    system_status: "active",
    next_inspection_anchor_date: "",
    notes: "",
    qr_enabled: "TRUE",
  };
}

function makeSystemDraft(system: any): SelectedSystemDraft {
  return {
    system_code: String(system.system_code || ""),
    system_name_override: "",
    coverage_scope: "كامل المبنى",
    protection_area: "",
    standard_profile: String(system.related_standard || system.standard_profile || ""),
    system_status: "active",
    qr_enabled: "TRUE",
  };
}

function panelStyle(active = false): CSSProperties {
  return {
    border: active ? "1px solid #99f6e4" : "1px solid #e2e8f0",
    background: active ? "#ecfeff" : "#fff",
    borderRadius: "22px",
    padding: "14px",
  };
}

function actionCardStyle(active = false): CSSProperties {
  return {
    border: active ? "1px solid #99f6e4" : "1px solid #e2e8f0",
    background: active ? "#ecfeff" : "#fff",
    borderRadius: "24px",
    padding: "18px",
    minHeight: "118px",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    textAlign: "center",
    gap: "10px",
    color: "#0f172a",
    cursor: "pointer",
  };
}

function findSystemRef(systemOptions: any[], code: string) {
  return systemOptions.find(
    (system: any) => String(system.system_code || "") === String(code || "")
  );
}

function displaySystemForCard(system: any, ref?: any) {
  return safeText(
    system.system_name_override ||
      ref?.system_name_ar ||
      ref?.system_name ||
      ref?.system_display_name_ar ||
      ref?.system_display_name ||
      toSystemLabel(system.system_code),
    "نظام"
  );
}

export default function FacilityStructureManager({
  facility,
  buildings,
  systems,
  systemsRef = [],
}: Props) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("none");
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingBuildingId, setEditingBuildingId] = useState("");
  const [addingSystemBuildingId, setAddingSystemBuildingId] = useState("");
  const [editingSystemId, setEditingSystemId] = useState("");

  const systemOptions = useMemo(() => {
    const seen = new Set<string>();

    return systemsRef.filter((row: any) => {
      const code = String(row.system_code || "").trim();

      if (!code) return false;
      if (seen.has(code)) return false;
      if (!isEnabledSystem(row)) return false;

      seen.add(code);
      return true;
    });
  }, [systemsRef]);

  const [facilityForm, setFacilityForm] = useState({
    facility_code: text(facility.facility_code),
    facility_name: text(facility.facility_name),
    facility_name_ar: text(facility.facility_name_ar),
    owner_name: text(facility.owner_name),
    operator_name: text(facility.operator_name),
    facility_type: text(facility.facility_type),
    occupancy_classification: text(facility.occupancy_classification),
    city: text(facility.city),
    district: text(facility.district),
    address: text(facility.address),
    latitude: text(facility.latitude),
    longitude: text(facility.longitude),
    contact_person: text(facility.contact_person),
    contact_phone: text(facility.contact_phone),
    contact_email: text(facility.contact_email),
    authority_profile_id: text(facility.authority_profile_id),
    active_status: text(facility.active_status || "active"),
    notes: text(facility.notes),
  });

  const [newBuildingForm, setNewBuildingForm] = useState(
    defaultNewBuilding(String(facility.facility_id || ""))
  );

  const [selectedSystems, setSelectedSystems] = useState<
    Record<string, SelectedSystemDraft>
  >({});

  const [buildingForms, setBuildingForms] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};

    for (const building of buildings) {
      map[String(building.building_id)] = {
        building_code: text(building.building_code),
        building_name: text(building.building_name),
        building_name_ar: text(building.building_name_ar),
        building_use: text(building.building_use),
        construction_type: text(building.construction_type),
        number_of_floors: text(building.number_of_floors),
        basement_count: text(building.basement_count),
        building_height_m: text(building.building_height_m),
        area_m2: text(building.area_m2),
        occupancy_profile_id: text(building.occupancy_profile_id),
        risk_profile_id: text(building.risk_profile_id),
        year_built: text(building.year_built),
        last_major_renovation_year: text(building.last_major_renovation_year),
        civil_defense_permit_no: text(building.civil_defense_permit_no),
        evacuation_strategy: text(building.evacuation_strategy),
        status: text(building.status || "active"),
        notes: text(building.notes),
      };
    }

    return map;
  });

  const [systemForms, setSystemForms] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};

    for (const system of systems) {
      map[String(system.building_system_id)] = {
        system_instance_code: text(system.system_instance_code),
        system_code: text(system.system_code),
        system_name_override: text(system.system_name_override),
        coverage_scope: text(system.coverage_scope),
        protection_area: text(system.protection_area),
        standard_profile: text(system.standard_profile),
        system_status: text(system.system_status || "active"),
        next_inspection_anchor_date: text(system.next_inspection_anchor_date),
        notes: text(system.notes),
        qr_enabled: text(system.qr_enabled || "TRUE"),
      };
    }

    return map;
  });

  const [newSystemForms, setNewSystemForms] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};

    for (const building of buildings) {
      map[String(building.building_id)] = defaultNewSystem(
        String(building.building_id || "")
      );
    }

    return map;
  });

  const systemsByBuilding = useMemo(() => {
    const map: Record<string, any[]> = {};

    for (const building of buildings) {
      map[String(building.building_id)] = [];
    }

    for (const system of systems) {
      const key = String(system.building_id || "");
      if (!map[key]) map[key] = [];
      map[key].push(system);
    }

    return map;
  }, [buildings, systems]);

  function startBusy(key: string) {
    setBusyKey(key);
    setMessage("");
    setError("");
  }

  function endBusy() {
    setBusyKey("");
  }

  function isBusy(key: string) {
    return busyKey === key;
  }

  function openMode(nextMode: Mode) {
    setMessage("");
    setError("");
    setMode(mode === nextMode ? "none" : nextMode);
  }

  function toggleSystem(system: any) {
    const code = String(system.system_code || "");
    if (!code) return;

    setSelectedSystems((prev) => {
      if (prev[code]) {
        const clone = { ...prev };
        delete clone[code];
        return clone;
      }

      return {
        ...prev,
        [code]: makeSystemDraft(system),
      };
    });
  }

  function updateSelectedSystem(code: string, patch: Partial<SelectedSystemDraft>) {
    setSelectedSystems((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        ...patch,
      },
    }));
  }

  function resetWizard() {
    setWizardStep(1);
    setNewBuildingForm(defaultNewBuilding(String(facility.facility_id || "")));
    setSelectedSystems({});
  }

  async function saveFacility() {
    startBusy("facility-save");

    try {
      const res = await fetch(`/api/facilities/${facility.facility_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facilityForm),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر تحديث المنشأة");
      }

      setMessage("تم تحديث بيانات المنشأة بنجاح");
      setMode("none");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تحديث المنشأة");
    } finally {
      endBusy();
    }
  }

  async function archiveFacility() {
    if (!confirm("سيتم أرشفة المنشأة بدل حذفها نهائيًا. هل تريد المتابعة؟")) {
      return;
    }

    startBusy("facility-archive");

    try {
      const res = await fetch(`/api/facilities/${facility.facility_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر أرشفة المنشأة");
      }

      setMessage("تمت أرشفة المنشأة بنجاح");
      setMode("none");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر أرشفة المنشأة");
    } finally {
      endBusy();
    }
  }

  async function addBuildingWithSystems() {
    const systemsToCreate = Object.values(selectedSystems);

    if (!newBuildingForm.building_name && !newBuildingForm.building_name_ar) {
      setError("أدخل اسم المبنى أولًا.");
      return;
    }

    startBusy("building-wizard-add");

    try {
      const buildingRes = await fetch(`/api/buildings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBuildingForm),
      });

      const buildingData = await buildingRes.json();

      if (!buildingRes.ok || !buildingData.ok) {
        throw new Error(buildingData.message || "تعذر إضافة المبنى");
      }

      const buildingId = String(
        buildingData.buildingId ||
          buildingData.building_id ||
          buildingData.id ||
          buildingData.data?.building_id ||
          ""
      ).trim();

      if (systemsToCreate.length > 0 && !buildingId) {
        throw new Error(
          "تم إنشاء المبنى، لكن API لا يرجع buildingId. نحتاج تعديل app/api/buildings/route.ts."
        );
      }

      for (const system of systemsToCreate) {
        const res = await fetch(`/api/building-systems`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            building_id: buildingId,
            system_code: system.system_code,
            system_name_override: system.system_name_override,
            coverage_scope: system.coverage_scope,
            protection_area: system.protection_area,
            standard_profile: system.standard_profile,
            system_status: system.system_status || "active",
            qr_enabled: system.qr_enabled || "TRUE",
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || `تعذر إنشاء النظام ${system.system_code}`);
        }
      }

      setMessage(
        systemsToCreate.length > 0
          ? "تمت إضافة المبنى وإنشاء الأنظمة و QR لكل نظام بنجاح"
          : "تمت إضافة المبنى بنجاح"
      );

      resetWizard();
      setMode("none");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إضافة المبنى");
    } finally {
      endBusy();
    }
  }

  async function saveBuilding(buildingId: string) {
    startBusy(`building-save-${buildingId}`);

    try {
      const res = await fetch(`/api/buildings/${buildingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildingForms[buildingId]),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر تحديث المبنى");
      }

      setMessage("تم تحديث المبنى بنجاح");
      setEditingBuildingId("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تحديث المبنى");
    } finally {
      endBusy();
    }
  }

  async function archiveBuilding(buildingId: string) {
    if (!confirm("سيتم أرشفة المبنى بدل حذفه نهائيًا. هل تريد المتابعة؟")) {
      return;
    }

    startBusy(`building-archive-${buildingId}`);

    try {
      const res = await fetch(`/api/buildings/${buildingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر أرشفة المبنى");
      }

      setMessage("تمت أرشفة المبنى بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر أرشفة المبنى");
    } finally {
      endBusy();
    }
  }

  async function addSystem(buildingId: string) {
    const payload = newSystemForms[buildingId] || defaultNewSystem(buildingId);

    if (!payload.system_code) {
      setError("اختر نوع النظام أولًا.");
      return;
    }

    startBusy(`system-add-${buildingId}`);

    try {
      const res = await fetch(`/api/building-systems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إضافة النظام");
      }

      setMessage("تمت إضافة النظام بنجاح");
      setAddingSystemBuildingId("");
      setNewSystemForms((prev) => ({
        ...prev,
        [buildingId]: defaultNewSystem(buildingId),
      }));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إضافة النظام");
    } finally {
      endBusy();
    }
  }

  async function saveSystem(buildingSystemId: string) {
    startBusy(`system-save-${buildingSystemId}`);

    try {
      const res = await fetch(`/api/building-systems/${buildingSystemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemForms[buildingSystemId]),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر تحديث النظام");
      }

      setMessage("تم تحديث النظام بنجاح");
      setEditingSystemId("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تحديث النظام");
    } finally {
      endBusy();
    }
  }

  async function archiveSystem(buildingSystemId: string) {
    if (!confirm("سيتم أرشفة النظام بدل حذفه نهائيًا. هل تريد المتابعة؟")) {
      return;
    }

    startBusy(`system-archive-${buildingSystemId}`);

    try {
      const res = await fetch(`/api/building-systems/${buildingSystemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر أرشفة النظام");
      }

      setMessage("تمت أرشفة النظام بنجاح");
      setEditingSystemId("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر أرشفة النظام");
    } finally {
      endBusy();
    }
  }

  return (
    <div>
      {message ? (
        <div className="alert-success" style={{ marginBottom: "12px" }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="alert-error" style={{ marginBottom: "12px" }}>
          {error}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
        }}
      >
        <button
          type="button"
          style={actionCardStyle(mode === "edit-facility")}
          onClick={() => openMode("edit-facility")}
        >
          <Pencil size={32} color="#0f766e" />
          <div style={{ fontSize: "17px", fontWeight: 900 }}>تعديل المنشأة</div>
        </button>

        <button
          type="button"
          style={actionCardStyle(mode === "add-building")}
          onClick={() => openMode("add-building")}
        >
          <Plus size={34} color="#0f766e" />
          <div style={{ fontSize: "17px", fontWeight: 900 }}>إضافة مبنى</div>
        </button>

        <button
          type="button"
          style={actionCardStyle(mode === "manage-buildings")}
          onClick={() => openMode("manage-buildings")}
        >
          <Wrench size={32} color="#475569" />
          <div style={{ fontSize: "17px", fontWeight: 900 }}>إدارة المباني</div>
        </button>

        <button
          type="button"
          style={actionCardStyle(false)}
          onClick={() => setMessage("قريبًا: صفحة طباعة ملصقات QR للأنظمة.")}
        >
          <QrCode size={32} color="#b45309" />
          <div style={{ fontSize: "17px", fontWeight: 900 }}>QR الأنظمة</div>
        </button>
      </div>

      {mode === "edit-facility" ? (
        <div className="card" style={{ padding: "16px", marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
              تعديل بيانات المنشأة
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMode("none")}
            >
              <X size={18} />
              إغلاق
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            <input
              className="field"
              placeholder="كود المنشأة"
              value={facilityForm.facility_code}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  facility_code: e.target.value,
                }))
              }
            />

            <input
              className="field"
              placeholder="اسم المنشأة"
              value={facilityForm.facility_name}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  facility_name: e.target.value,
                }))
              }
            />

            <input
              className="field"
              placeholder="اسم المنشأة بالعربي"
              value={facilityForm.facility_name_ar}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  facility_name_ar: e.target.value,
                }))
              }
            />

            <input
              className="field"
              placeholder="نوع المنشأة"
              value={facilityForm.facility_type}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  facility_type: e.target.value,
                }))
              }
            />

            <input
              className="field"
              placeholder="المدينة"
              value={facilityForm.city}
              onChange={(e) =>
                setFacilityForm((prev) => ({ ...prev, city: e.target.value }))
              }
            />

            <input
              className="field"
              placeholder="الحي"
              value={facilityForm.district}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  district: e.target.value,
                }))
              }
            />

            <input
              className="field"
              placeholder="الشخص المسؤول"
              value={facilityForm.contact_person}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  contact_person: e.target.value,
                }))
              }
            />

            <input
              className="field"
              placeholder="رقم التواصل"
              value={facilityForm.contact_phone}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  contact_phone: e.target.value,
                }))
              }
            />

            <select
              className="field"
              value={facilityForm.active_status}
              onChange={(e) =>
                setFacilityForm((prev) => ({
                  ...prev,
                  active_status: e.target.value,
                }))
              }
            >
              <option value="active">نشطة</option>
              <option value="inactive">غير نشطة</option>
              <option value="archived">مؤرشفة</option>
            </select>
          </div>

          <textarea
            className="field"
            placeholder="العنوان"
            value={facilityForm.address}
            onChange={(e) =>
              setFacilityForm((prev) => ({ ...prev, address: e.target.value }))
            }
            style={{ marginTop: "10px" }}
          />

          <textarea
            className="field"
            placeholder="ملاحظات"
            value={facilityForm.notes}
            onChange={(e) =>
              setFacilityForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            style={{ marginTop: "10px" }}
          />

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={saveFacility}
              disabled={isBusy("facility-save")}
            >
              <Save size={18} />
              {isBusy("facility-save") ? "جارٍ الحفظ..." : "حفظ المنشأة"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={archiveFacility}
              disabled={isBusy("facility-archive")}
            >
              <Trash2 size={18} />
              {isBusy("facility-archive") ? "جارٍ الأرشفة..." : "أرشفة المنشأة"}
            </button>
          </div>
        </div>
      ) : null}

      {mode === "add-building" ? (
        <div className="card" style={{ padding: "16px", marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
                إضافة مبنى جديد
              </div>
              <div style={{ marginTop: "4px", fontSize: "13px", color: "#64748b" }}>
                خطوة {wizardStep} من 3
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                resetWizard();
                setMode("none");
              }}
            >
              <X size={18} />
              إغلاق
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                style={{
                  height: "8px",
                  flex: 1,
                  borderRadius: "999px",
                  background: step <= wizardStep ? "#0f766e" : "#e2e8f0",
                }}
              />
            ))}
          </div>

          {wizardStep === 1 ? (
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: "10px",
                }}
              >
                1. بيانات المبنى
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "10px",
                }}
              >
                <input
                  className="field"
                  placeholder="كود المبنى"
                  value={newBuildingForm.building_code}
                  onChange={(e) =>
                    setNewBuildingForm((prev) => ({
                      ...prev,
                      building_code: e.target.value,
                    }))
                  }
                />

                <input
                  className="field"
                  placeholder="اسم المبنى"
                  value={newBuildingForm.building_name}
                  onChange={(e) =>
                    setNewBuildingForm((prev) => ({
                      ...prev,
                      building_name: e.target.value,
                    }))
                  }
                />

                <input
                  className="field"
                  placeholder="اسم المبنى بالعربي"
                  value={newBuildingForm.building_name_ar}
                  onChange={(e) =>
                    setNewBuildingForm((prev) => ({
                      ...prev,
                      building_name_ar: e.target.value,
                    }))
                  }
                />

                <input
                  className="field"
                  placeholder="استخدام المبنى"
                  value={newBuildingForm.building_use}
                  onChange={(e) =>
                    setNewBuildingForm((prev) => ({
                      ...prev,
                      building_use: e.target.value,
                    }))
                  }
                />

                <input
                  className="field"
                  placeholder="عدد الأدوار"
                  value={newBuildingForm.number_of_floors}
                  onChange={(e) =>
                    setNewBuildingForm((prev) => ({
                      ...prev,
                      number_of_floors: e.target.value,
                    }))
                  }
                />

                <select
                  className="field"
                  value={newBuildingForm.status}
                  onChange={(e) =>
                    setNewBuildingForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </div>

              <textarea
                className="field"
                placeholder="ملاحظات المبنى"
                value={newBuildingForm.notes}
                onChange={(e) =>
                  setNewBuildingForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                style={{ marginTop: "10px" }}
              />

              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setWizardStep(2)}
                >
                  التالي: اختيار الأنظمة
                </button>
              </div>
            </div>
          ) : null}

          {wizardStep === 2 ? (
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: "6px",
                }}
              >
                2. الأنظمة الموجودة داخل المبنى
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginBottom: "12px",
                  lineHeight: 1.7,
                }}
              >
                القائمة تقرأ من شيت SYSTEMS_REF بنفس الترتيب. اختر الأنظمة
                الموجودة داخل هذا المبنى.
              </div>

              {systemOptions.length === 0 ? (
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
                  لا توجد أنظمة مفعّلة في SYSTEMS_REF.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {systemOptions.map((system: any) => {
                    const code = String(system.system_code || "");
                    const selected = Boolean(selectedSystems[code]);

                    return (
                      <div key={code} style={panelStyle(selected)}>
                        <button
                          type="button"
                          onClick={() => toggleSystem(system)}
                          style={{
                            width: "100%",
                            border: 0,
                            background: "transparent",
                            padding: 0,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            cursor: "pointer",
                            textAlign: "right",
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
                              {systemArabicName(system) ||
                                systemEnglishName(system) ||
                                code}
                            </div>

                            {systemEnglishName(system) ? (
                              <div
                                style={{
                                  marginTop: "2px",
                                  fontSize: "12px",
                                  color: "#64748b",
                                  lineHeight: 1.5,
                                }}
                              >
                                {systemEnglishName(system)}
                              </div>
                            ) : null}

                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#94a3b8",
                                lineHeight: 1.5,
                              }}
                            >
                              {code}
                              {system.related_standard
                                ? ` · ${String(system.related_standard)}`
                                : ""}
                            </div>
                          </div>

                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              border: selected
                                ? "7px solid #0f766e"
                                : "2px solid #cbd5e1",
                              background: "#fff",
                              flexShrink: 0,
                            }}
                          />
                        </button>

                        {selected ? (
                          <div
                            style={{
                              marginTop: "12px",
                              display: "grid",
                              gap: "8px",
                            }}
                          >
                            <input
                              className="field"
                              placeholder="اسم مخصص داخل المبنى - اختياري"
                              value={selectedSystems[code].system_name_override}
                              onChange={(e) =>
                                updateSelectedSystem(code, {
                                  system_name_override: e.target.value,
                                })
                              }
                            />

                            <input
                              className="field"
                              placeholder="منطقة الحماية / الموقع"
                              value={selectedSystems[code].protection_area}
                              onChange={(e) =>
                                updateSelectedSystem(code, {
                                  protection_area: e.target.value,
                                })
                              }
                            />

                            <input
                              className="field"
                              placeholder="نطاق التغطية"
                              value={selectedSystems[code].coverage_scope}
                              onChange={(e) =>
                                updateSelectedSystem(code, {
                                  coverage_scope: e.target.value,
                                })
                              }
                            />

                            <select
                              className="field"
                              value={selectedSystems[code].qr_enabled}
                              onChange={(e) =>
                                updateSelectedSystem(code, {
                                  qr_enabled: e.target.value,
                                })
                              }
                            >
                              <option value="TRUE">تفعيل QR لهذا النظام</option>
                              <option value="FALSE">بدون QR</option>
                            </select>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setWizardStep(1)}
                >
                  رجوع
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setWizardStep(3)}
                >
                  التالي: مراجعة
                </button>
              </div>
            </div>
          ) : null}

          {wizardStep === 3 ? (
            <div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#0f172a",
                  marginBottom: "10px",
                }}
              >
                3. مراجعة قبل الحفظ
              </div>

              <div
                className="card"
                style={{
                  padding: "14px",
                  background: "#f8fafc",
                  marginBottom: "12px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#64748b" }}>المبنى</div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "18px",
                    fontWeight: 900,
                    color: "#0f172a",
                    lineHeight: 1.6,
                  }}
                >
                  {safeText(
                    newBuildingForm.building_name_ar ||
                      newBuildingForm.building_name,
                    "مبنى جديد"
                  )}
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  عدد الأنظمة المختارة: {Object.keys(selectedSystems).length}
                </div>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                {Object.values(selectedSystems).length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: "18px",
                      padding: "14px",
                      fontSize: "13px",
                      color: "#64748b",
                      lineHeight: 1.8,
                    }}
                  >
                    لم يتم اختيار أنظمة. سيتم إنشاء المبنى فقط.
                  </div>
                ) : (
                  Object.values(selectedSystems).map((system) => {
                    const ref = findSystemRef(systemOptions, system.system_code);
                    const label =
                      safeText(system.system_name_override, "") ||
                      systemOptionLabel(ref || system);

                    return (
                      <div
                        key={system.system_code}
                        className="card"
                        style={{
                          padding: "12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 900,
                              color: "#0f172a",
                              lineHeight: 1.5,
                            }}
                          >
                            {label}
                          </div>

                          <div
                            style={{
                              marginTop: "3px",
                              fontSize: "12px",
                              color: "#64748b",
                            }}
                          >
                            {system.system_code}
                          </div>
                        </div>

                        {system.qr_enabled === "TRUE" ? (
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              borderRadius: "999px",
                              padding: "6px 10px",
                              background: "#ecfeff",
                              border: "1px solid #ccfbf1",
                              color: "#0f766e",
                              fontSize: "12px",
                              fontWeight: 800,
                            }}
                          >
                            <QrCode size={14} />
                            QR
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setWizardStep(2)}
                >
                  رجوع
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={addBuildingWithSystems}
                  disabled={isBusy("building-wizard-add")}
                >
                  <CheckCircle2 size={18} />
                  {isBusy("building-wizard-add")
                    ? "جارٍ الحفظ..."
                    : "حفظ المبنى وإنشاء الأنظمة"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "manage-buildings" ? (
        <div className="card" style={{ padding: "16px", marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
              إدارة المباني والأنظمة
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMode("none")}
            >
              <X size={18} />
              إغلاق
            </button>
          </div>

          {buildings.length === 0 ? (
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
              لا توجد مبانٍ حتى الآن.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {buildings.map((building: any) => {
                const buildingId = String(building.building_id || "");
                const form = buildingForms[buildingId] || {};
                const buildingSystems = systemsByBuilding[buildingId] || [];
                const newSystemForm =
                  newSystemForms[buildingId] || defaultNewSystem(buildingId);

                return (
                  <div key={buildingId} className="card" style={{ padding: "14px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "17px",
                            fontWeight: 900,
                            color: "#0f172a",
                            lineHeight: 1.5,
                          }}
                        >
                          {safeText(
                            building.building_name_ar || building.building_name,
                            "مبنى"
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "13px",
                            color: "#64748b",
                          }}
                        >
                          {safeText(building.building_code, "-")} · الأنظمة:{" "}
                          {buildingSystems.length}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            setEditingBuildingId(
                              editingBuildingId === buildingId ? "" : buildingId
                            )
                          }
                        >
                          <Pencil size={16} />
                          تعديل
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            setAddingSystemBuildingId(
                              addingSystemBuildingId === buildingId
                                ? ""
                                : buildingId
                            )
                          }
                        >
                          <Layers3 size={16} />
                          إضافة نظام
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginTop: "12px",
                      }}
                    >
                      {buildingSystems.length === 0 ? (
                        <div
                          style={{
                            border: "1px dashed #cbd5e1",
                            borderRadius: "999px",
                            padding: "8px 12px",
                            fontSize: "13px",
                            color: "#64748b",
                          }}
                        >
                          لا توجد أنظمة
                        </div>
                      ) : (
                        buildingSystems.map((system: any) => {
                          const systemId = String(system.building_system_id || "");
                          const active = editingSystemId === systemId;
                          const ref = findSystemRef(systemOptions, system.system_code);

                          return (
                            <button
                              key={systemId}
                              type="button"
                              onClick={() => setEditingSystemId(active ? "" : systemId)}
                              style={{
                                borderRadius: "999px",
                                border: active
                                  ? "1px solid #99f6e4"
                                  : "1px solid #e2e8f0",
                                background: active ? "#ecfeff" : "#f8fafc",
                                padding: "8px 12px",
                                color: active ? "#0f766e" : "#334155",
                                fontSize: "13px",
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                                    {displaySystemForCard(system, ref)}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {editingBuildingId === buildingId ? (
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 900,
                            color: "#0f172a",
                            marginBottom: "10px",
                          }}
                        >
                          تعديل بيانات المبنى
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                            gap: "10px",
                          }}
                        >
                          <input
                            className="field"
                            placeholder="كود المبنى"
                            value={form.building_code || ""}
                            onChange={(e) =>
                              setBuildingForms((prev) => ({
                                ...prev,
                                [buildingId]: {
                                  ...prev[buildingId],
                                  building_code: e.target.value,
                                },
                              }))
                            }
                          />

                          <input
                            className="field"
                            placeholder="اسم المبنى"
                            value={form.building_name || ""}
                            onChange={(e) =>
                              setBuildingForms((prev) => ({
                                ...prev,
                                [buildingId]: {
                                  ...prev[buildingId],
                                  building_name: e.target.value,
                                },
                              }))
                            }
                          />

                          <input
                            className="field"
                            placeholder="اسم المبنى بالعربي"
                            value={form.building_name_ar || ""}
                            onChange={(e) =>
                              setBuildingForms((prev) => ({
                                ...prev,
                                [buildingId]: {
                                  ...prev[buildingId],
                                  building_name_ar: e.target.value,
                                },
                              }))
                            }
                          />

                          <input
                            className="field"
                            placeholder="عدد الأدوار"
                            value={form.number_of_floors || ""}
                            onChange={(e) =>
                              setBuildingForms((prev) => ({
                                ...prev,
                                [buildingId]: {
                                  ...prev[buildingId],
                                  number_of_floors: e.target.value,
                                },
                              }))
                            }
                          />

                          <select
                            className="field"
                            value={form.status || "active"}
                            onChange={(e) =>
                              setBuildingForms((prev) => ({
                                ...prev,
                                [buildingId]: {
                                  ...prev[buildingId],
                                  status: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                            <option value="archived">مؤرشف</option>
                          </select>
                        </div>

                        <textarea
                          className="field"
                          placeholder="ملاحظات المبنى"
                          value={form.notes || ""}
                          onChange={(e) =>
                            setBuildingForms((prev) => ({
                              ...prev,
                              [buildingId]: {
                                ...prev[buildingId],
                                notes: e.target.value,
                              },
                            }))
                          }
                          style={{ marginTop: "10px" }}
                        />

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            type="button"
                            className="btn"
                            onClick={() => saveBuilding(buildingId)}
                            disabled={isBusy(`building-save-${buildingId}`)}
                          >
                            <Save size={18} />
                            {isBusy(`building-save-${buildingId}`)
                              ? "جارٍ الحفظ..."
                              : "حفظ المبنى"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => archiveBuilding(buildingId)}
                            disabled={isBusy(`building-archive-${buildingId}`)}
                          >
                            <Trash2 size={18} />
                            أرشفة المبنى
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {addingSystemBuildingId === buildingId ? (
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "15px",
                            fontWeight: 900,
                            color: "#0f172a",
                            marginBottom: "10px",
                          }}
                        >
                          إضافة نظام لهذا المبنى
                        </div>

                        {systemOptions.length === 0 ? (
                          <div
                            style={{
                              border: "1px dashed #cbd5e1",
                              borderRadius: "18px",
                              padding: "14px",
                              color: "#64748b",
                              fontSize: "13px",
                            }}
                          >
                            لا توجد أنظمة مفعّلة في SYSTEMS_REF.
                          </div>
                        ) : (
                          <div style={{ display: "grid", gap: "8px" }}>
                            {systemOptions.map((option: any) => {
                              const code = String(option.system_code || "");
                              const active =
                                String(newSystemForm.system_code || "") === code;

                              return (
                                <button
                                  key={code}
                                  type="button"
                                  onClick={() => {
                                    setNewSystemForms((prev) => ({
                                      ...prev,
                                      [buildingId]: {
                                        ...defaultNewSystem(buildingId),
                                        system_code: code,
                                        system_name_override: "",
                                        standard_profile: String(
                                          option.related_standard ||
                                            option.standard_profile ||
                                            ""
                                        ),
                                        qr_enabled: "TRUE",
                                      },
                                    }));
                                  }}
                                  style={{
                                    width: "100%",
                                    border: active
                                      ? "1px solid #99f6e4"
                                      : "1px solid #e2e8f0",
                                    background: active ? "#ecfeff" : "#fff",
                                    borderRadius: "18px",
                                    padding: "12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "10px",
                                    cursor: "pointer",
                                    textAlign: "right",
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
                                      {systemArabicName(option) ||
                                        systemEnglishName(option) ||
                                        code}
                                    </div>

                                    {systemEnglishName(option) ? (
                                      <div
                                        style={{
                                          marginTop: "2px",
                                          fontSize: "12px",
                                          color: "#64748b",
                                          lineHeight: 1.5,
                                        }}
                                      >
                                        {systemEnglishName(option)}
                                      </div>
                                    ) : null}

                                    <div
                                      style={{
                                        marginTop: "4px",
                                        fontSize: "12px",
                                        color: "#94a3b8",
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {code}
                                      {option.related_standard
                                        ? ` · ${String(option.related_standard)}`
                                        : ""}
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

                        {newSystemForm.system_code ? (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                              gap: "10px",
                              marginTop: "10px",
                            }}
                          >
                            <input
                              className="field"
                              placeholder="اسم مخصص داخل المبنى - اختياري"
                              value={newSystemForm.system_name_override || ""}
                              onChange={(e) =>
                                setNewSystemForms((prev) => ({
                                  ...prev,
                                  [buildingId]: {
                                    ...prev[buildingId],
                                    system_name_override: e.target.value,
                                  },
                                }))
                              }
                            />

                            <input
                              className="field"
                              placeholder="منطقة الحماية / الموقع"
                              value={newSystemForm.protection_area || ""}
                              onChange={(e) =>
                                setNewSystemForms((prev) => ({
                                  ...prev,
                                  [buildingId]: {
                                    ...prev[buildingId],
                                    protection_area: e.target.value,
                                  },
                                }))
                              }
                            />

                            <input
                              className="field"
                              placeholder="نطاق التغطية"
                              value={newSystemForm.coverage_scope || ""}
                              onChange={(e) =>
                                setNewSystemForms((prev) => ({
                                  ...prev,
                                  [buildingId]: {
                                    ...prev[buildingId],
                                    coverage_scope: e.target.value,
                                  },
                                }))
                              }
                            />

                            <select
                              className="field"
                              value={newSystemForm.qr_enabled || "TRUE"}
                              onChange={(e) =>
                                setNewSystemForms((prev) => ({
                                  ...prev,
                                  [buildingId]: {
                                    ...prev[buildingId],
                                    qr_enabled: e.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="TRUE">تفعيل QR</option>
                              <option value="FALSE">بدون QR</option>
                            </select>
                          </div>
                        ) : null}

                        <div style={{ marginTop: "12px" }}>
                          <button
                            type="button"
                            className="btn"
                            onClick={() => addSystem(buildingId)}
                            disabled={
                              isBusy(`system-add-${buildingId}`) ||
                              !newSystemForm.system_code
                            }
                          >
                            <Plus size={18} />
                            {isBusy(`system-add-${buildingId}`)
                              ? "جارٍ الإضافة..."
                              : "إضافة النظام"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {editingSystemId &&
                    buildingSystems.some(
                      (s: any) =>
                        String(s.building_system_id || "") === editingSystemId
                    ) ? (
                      <div
                        style={{
                          marginTop: "12px",
                          paddingTop: "12px",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        {buildingSystems
                          .filter(
                            (s: any) =>
                              String(s.building_system_id || "") ===
                              editingSystemId
                          )
                          .map((system: any) => {
                            const systemId = String(system.building_system_id || "");
                            const form = systemForms[systemId] || {};

                            return (
                              <div key={systemId}>
                                <div
                                  style={{
                                    fontSize: "15px",
                                    fontWeight: 900,
                                    color: "#0f172a",
                                    marginBottom: "10px",
                                  }}
                                >
                                  تعديل النظام
                                </div>

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(2, minmax(0, 1fr))",
                                    gap: "10px",
                                  }}
                                >
                                  <input
                                    className="field"
                                    placeholder="اسم مخصص للنظام - اختياري"
                                    value={form.system_name_override || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          system_name_override: e.target.value,
                                        },
                                      }))
                                    }
                                  />

                                  <input
                                    className="field"
                                    placeholder="منطقة الحماية"
                                    value={form.protection_area || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          protection_area: e.target.value,
                                        },
                                      }))
                                    }
                                  />

                                  <input
                                    className="field"
                                    placeholder="نطاق التغطية"
                                    value={form.coverage_scope || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          coverage_scope: e.target.value,
                                        },
                                      }))
                                    }
                                  />

                                  <select
                                    className="field"
                                    value={form.system_status || "active"}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          system_status: e.target.value,
                                        },
                                      }))
                                    }
                                  >
                                    <option value="active">نشط</option>
                                    <option value="inactive">غير نشط</option>
                                    <option value="out_of_service">خارج الخدمة</option>
                                    <option value="archived">مؤرشف</option>
                                  </select>
                                </div>

                                <textarea
                                  className="field"
                                  placeholder="ملاحظات النظام"
                                  value={form.notes || ""}
                                  onChange={(e) =>
                                    setSystemForms((prev) => ({
                                      ...prev,
                                      [systemId]: {
                                        ...prev[systemId],
                                        notes: e.target.value,
                                      },
                                    }))
                                  }
                                  style={{ marginTop: "10px" }}
                                />

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    flexWrap: "wrap",
                                    marginTop: "12px",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="btn"
                                    onClick={() => saveSystem(systemId)}
                                    disabled={isBusy(`system-save-${systemId}`)}
                                  >
                                    <Save size={18} />
                                    {isBusy(`system-save-${systemId}`)
                                      ? "جارٍ الحفظ..."
                                      : "حفظ النظام"}
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => archiveSystem(systemId)}
                                    disabled={isBusy(`system-archive-${systemId}`)}
                                  >
                                    <Trash2 size={18} />
                                    أرشفة النظام
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
