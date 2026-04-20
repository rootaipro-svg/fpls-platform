"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Save, Trash2, Wrench } from "lucide-react";
import { safeText, toSystemLabel } from "@/lib/display";

type Props = {
  facility: any;
  buildings: any[];
  systems: any[];
};

function text(value: any) {
  return String(value ?? "");
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
  };
}

export default function FacilityStructureManager({
  facility,
  buildings,
  systems,
}: Props) {
  const router = useRouter();

  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
        authority_profile_id: text(system.authority_profile_id),
        manufacturer: text(system.manufacturer),
        model: text(system.model),
        serial_no: text(system.serial_no),
        install_date: text(system.install_date),
        commission_date: text(system.commission_date),
        service_provider: text(system.service_provider),
        approval_lab_code: text(system.approval_lab_code),
        criticality_class: text(system.criticality_class),
        system_status: text(system.system_status || "active"),
        next_inspection_anchor_date: text(system.next_inspection_anchor_date),
        notes: text(system.notes),
      };
    }
    return map;
  });

  const [newBuildingForm, setNewBuildingForm] = useState(
    defaultNewBuilding(String(facility.facility_id || ""))
  );

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
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر أرشفة المنشأة");
    } finally {
      endBusy();
    }
  }

  async function addBuilding() {
    startBusy("building-add");
    try {
      const res = await fetch(`/api/buildings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBuildingForm),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إضافة المبنى");
      }

      setMessage("تمت إضافة المبنى بنجاح");
      setNewBuildingForm(defaultNewBuilding(String(facility.facility_id || "")));
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
    startBusy(`system-add-${buildingId}`);
    try {
      const payload = newSystemForms[buildingId] || defaultNewSystem(buildingId);

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

      <div className="card" style={{ padding: "16px" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: "12px",
          }}
        >
          تعديل بيانات المنشأة
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
              setFacilityForm((prev) => ({ ...prev, facility_code: e.target.value }))
            }
          />
          <input
            className="field"
            placeholder="اسم المنشأة"
            value={facilityForm.facility_name}
            onChange={(e) =>
              setFacilityForm((prev) => ({ ...prev, facility_name: e.target.value }))
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
              setFacilityForm((prev) => ({ ...prev, facility_type: e.target.value }))
            }
          />
          <input
            className="field"
            placeholder="تصنيف الإشغال"
            value={facilityForm.occupancy_classification}
            onChange={(e) =>
              setFacilityForm((prev) => ({
                ...prev,
                occupancy_classification: e.target.value,
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
              setFacilityForm((prev) => ({ ...prev, district: e.target.value }))
            }
          />
          <input
            className="field"
            placeholder="المالك"
            value={facilityForm.owner_name}
            onChange={(e) =>
              setFacilityForm((prev) => ({ ...prev, owner_name: e.target.value }))
            }
          />
          <input
            className="field"
            placeholder="المشغل"
            value={facilityForm.operator_name}
            onChange={(e) =>
              setFacilityForm((prev) => ({ ...prev, operator_name: e.target.value }))
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
          <input
            className="field"
            placeholder="البريد الإلكتروني"
            value={facilityForm.contact_email}
            onChange={(e) =>
              setFacilityForm((prev) => ({
                ...prev,
                contact_email: e.target.value,
              }))
            }
          />
          <input
            className="field"
            placeholder="Latitude"
            value={facilityForm.latitude}
            onChange={(e) =>
              setFacilityForm((prev) => ({ ...prev, latitude: e.target.value }))
            }
          />
          <input
            className="field"
            placeholder="Longitude"
            value={facilityForm.longitude}
            onChange={(e) =>
              setFacilityForm((prev) => ({ ...prev, longitude: e.target.value }))
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
          <input
            className="field"
            placeholder="Authority Profile ID"
            value={facilityForm.authority_profile_id}
            onChange={(e) =>
              setFacilityForm((prev) => ({
                ...prev,
                authority_profile_id: e.target.value,
              }))
            }
          />
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

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
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
            {isBusy("facility-archive") ? "جارٍ الأرشفة..." : "حذف / أرشفة المنشأة"}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "16px", marginTop: "14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <Building2 size={20} />
          <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>
            إضافة مبنى جديد
          </div>
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
            onClick={addBuilding}
            disabled={isBusy("building-add")}
          >
            <Plus size={18} />
            {isBusy("building-add") ? "جارٍ الإضافة..." : "إضافة مبنى"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
        {buildings.length === 0 ? (
          <div className="card" style={{ padding: "16px" }}>
            لا توجد مبانٍ حتى الآن.
          </div>
        ) : (
          buildings.map((building: any) => {
            const buildingId = String(building.building_id || "");
            const form = buildingForms[buildingId] || {};
            const buildingSystems = systemsByBuilding[buildingId] || [];
            const newSystemForm =
              newSystemForms[buildingId] || defaultNewSystem(buildingId);

            return (
              <details
                key={buildingId}
                className="card"
                style={{ padding: "16px" }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1.5,
                      }}
                    >
                      {safeText(building.building_name_ar || building.building_name, "مبنى")}
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
                      display: "inline-flex",
                      alignItems: "center",
                      borderRadius: "999px",
                      padding: "6px 10px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    {safeText(form.status || building.status, "active")}
                  </div>
                </summary>

                <div style={{ marginTop: "14px" }}>
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
                      placeholder="استخدام المبنى"
                      value={form.building_use || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            building_use: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="field"
                      placeholder="الإنشاء"
                      value={form.construction_type || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            construction_type: e.target.value,
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
                    <input
                      className="field"
                      placeholder="عدد البدرومات"
                      value={form.basement_count || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            basement_count: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="field"
                      placeholder="الارتفاع بالمتر"
                      value={form.building_height_m || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            building_height_m: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="field"
                      placeholder="المساحة م2"
                      value={form.area_m2 || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            area_m2: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="field"
                      placeholder="سنة البناء"
                      value={form.year_built || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            year_built: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="field"
                      placeholder="آخر ترميم كبير"
                      value={form.last_major_renovation_year || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            last_major_renovation_year: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="field"
                      placeholder="رقم تصريح الدفاع المدني"
                      value={form.civil_defense_permit_no || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            civil_defense_permit_no: e.target.value,
                          },
                        }))
                      }
                    />
                    <input
                      className="field"
                      placeholder="استراتيجية الإخلاء"
                      value={form.evacuation_strategy || ""}
                      onChange={(e) =>
                        setBuildingForms((prev) => ({
                          ...prev,
                          [buildingId]: {
                            ...prev[buildingId],
                            evacuation_strategy: e.target.value,
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
                      gap: "10px",
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
                      {isBusy(`building-archive-${buildingId}`)
                        ? "جارٍ الأرشفة..."
                        : "حذف / أرشفة المبنى"}
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <Wrench size={18} />
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 900,
                          color: "#0f172a",
                        }}
                      >
                        أنظمة المبنى
                      </div>
                    </div>

                    {buildingSystems.length === 0 ? (
                      <div
                        className="card"
                        style={{ padding: "14px", marginBottom: "12px" }}
                      >
                        لا توجد أنظمة لهذا المبنى حتى الآن.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {buildingSystems.map((system: any) => {
                          const systemId = String(system.building_system_id || "");
                          const systemForm = systemForms[systemId] || {};

                          return (
                            <details
                              key={systemId}
                              className="card"
                              style={{ padding: "14px" }}
                            >
                              <summary
                                style={{
                                  cursor: "pointer",
                                  listStyle: "none",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: "10px",
                                  alignItems: "flex-start",
                                }}
                              >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: 800,
                                      color: "#0f172a",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {safeText(
                                      system.system_name_override ||
                                        toSystemLabel(system.system_code),
                                      "نظام"
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: "4px",
                                      fontSize: "13px",
                                      color: "#64748b",
                                    }}
                                  >
                                    {safeText(system.system_instance_code, "-")} ·{" "}
                                    {toSystemLabel(system.system_code)}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    borderRadius: "999px",
                                    padding: "6px 10px",
                                    border: "1px solid #e2e8f0",
                                    background: "#f8fafc",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#334155",
                                  }}
                                >
                                  {safeText(systemForm.system_status || system.system_status, "active")}
                                </div>
                              </summary>

                              <div style={{ marginTop: "14px" }}>
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
                                    placeholder="كود نسخة النظام"
                                    value={systemForm.system_instance_code || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          system_instance_code: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="system_code"
                                    value={systemForm.system_code || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          system_code: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="اسم النظام المخصص"
                                    value={systemForm.system_name_override || ""}
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
                                    placeholder="نطاق التغطية"
                                    value={systemForm.coverage_scope || ""}
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
                                  <input
                                    className="field"
                                    placeholder="منطقة الحماية"
                                    value={systemForm.protection_area || ""}
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
                                    placeholder="المرجع القياسي"
                                    value={systemForm.standard_profile || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          standard_profile: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="الشركة المصنعة"
                                    value={systemForm.manufacturer || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          manufacturer: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="الموديل"
                                    value={systemForm.model || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          model: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="الرقم التسلسلي"
                                    value={systemForm.serial_no || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          serial_no: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="تاريخ التركيب"
                                    type="date"
                                    value={systemForm.install_date || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          install_date: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="تاريخ التشغيل"
                                    type="date"
                                    value={systemForm.commission_date || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          commission_date: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="مزود الخدمة"
                                    value={systemForm.service_provider || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          service_provider: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="Approval Lab Code"
                                    value={systemForm.approval_lab_code || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          approval_lab_code: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="Criticality Class"
                                    value={systemForm.criticality_class || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          criticality_class: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <input
                                    className="field"
                                    placeholder="Anchor Date"
                                    type="date"
                                    value={systemForm.next_inspection_anchor_date || ""}
                                    onChange={(e) =>
                                      setSystemForms((prev) => ({
                                        ...prev,
                                        [systemId]: {
                                          ...prev[systemId],
                                          next_inspection_anchor_date:
                                            e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                  <select
                                    className="field"
                                    value={systemForm.system_status || "active"}
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
                                  value={systemForm.notes || ""}
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
                                    gap: "10px",
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
                                    {isBusy(`system-archive-${systemId}`)
                                      ? "جارٍ الأرشفة..."
                                      : "حذف / أرشفة النظام"}
                                  </button>
                                </div>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    )}

                    <div
                      className="card"
                      style={{
                        padding: "14px",
                        marginTop: "12px",
                        background: "#f8fafc",
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
                        إضافة نظام جديد لهذا المبنى
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
                          placeholder="كود نسخة النظام"
                          value={newSystemForm.system_instance_code || ""}
                          onChange={(e) =>
                            setNewSystemForms((prev) => ({
                              ...prev,
                              [buildingId]: {
                                ...prev[buildingId],
                                system_instance_code: e.target.value,
                              },
                            }))
                          }
                        />
                        <input
                          className="field"
                          placeholder="system_code"
                          value={newSystemForm.system_code || ""}
                          onChange={(e) =>
                            setNewSystemForms((prev) => ({
                              ...prev,
                              [buildingId]: {
                                ...prev[buildingId],
                                system_code: e.target.value,
                              },
                            }))
                          }
                        />
                        <input
                          className="field"
                          placeholder="اسم مخصص للنظام"
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
                          placeholder="المرجع القياسي"
                          value={newSystemForm.standard_profile || ""}
                          onChange={(e) =>
                            setNewSystemForms((prev) => ({
                              ...prev,
                              [buildingId]: {
                                ...prev[buildingId],
                                standard_profile: e.target.value,
                              },
                            }))
                          }
                        />
                        <select
                          className="field"
                          value={newSystemForm.system_status || "active"}
                          onChange={(e) =>
                            setNewSystemForms((prev) => ({
                              ...prev,
                              [buildingId]: {
                                ...prev[buildingId],
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
                        <input
                          className="field"
                          type="date"
                          placeholder="Anchor Date"
                          value={newSystemForm.next_inspection_anchor_date || ""}
                          onChange={(e) =>
                            setNewSystemForms((prev) => ({
                              ...prev,
                              [buildingId]: {
                                ...prev[buildingId],
                                next_inspection_anchor_date: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      <textarea
                        className="field"
                        placeholder="ملاحظات النظام"
                        value={newSystemForm.notes || ""}
                        onChange={(e) =>
                          setNewSystemForms((prev) => ({
                            ...prev,
                            [buildingId]: {
                              ...prev[buildingId],
                              notes: e.target.value,
                            },
                          }))
                        }
                        style={{ marginTop: "10px" }}
                      />

                      <div style={{ marginTop: "12px" }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => addSystem(buildingId)}
                          disabled={isBusy(`system-add-${buildingId}`)}
                        >
                          <Plus size={18} />
                          {isBusy(`system-add-${buildingId}`)
                            ? "جارٍ الإضافة..."
                            : "إضافة نظام"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
}
