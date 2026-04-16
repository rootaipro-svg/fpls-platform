"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardPlus } from "lucide-react";

type FacilityOption = {
  facility_id: string;
  facility_name: string;
};

type BuildingOption = {
  building_id: string;
  facility_id: string;
  building_name: string;
};

type BuildingSystemOption = {
  building_system_id: string;
  building_id: string;
  system_code: string;
};

type InspectorOption = {
  inspector_id: string;
  inspector_name: string;
};

type Props = {
  facilities: FacilityOption[];
  buildings: BuildingOption[];
  buildingSystems: BuildingSystemOption[];
  inspectors: InspectorOption[];
};

type FormState = {
  facility_id: string;
  building_id: string;
  visit_type: string;
  planned_date: string;
  due_date: string;
  assigned_inspector_id: string;
  notes: string;
  selected_system_ids: string[];
};

const initialState: FormState = {
  facility_id: "",
  building_id: "",
  visit_type: "routine",
  planned_date: "",
  due_date: "",
  assigned_inspector_id: "",
  notes: "",
  selected_system_ids: [],
};

export default function CreateVisitForm({
  facilities,
  buildings,
  buildingSystems,
  inspectors,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    ...initialState,
    facility_id: facilities[0]?.facility_id || "",
  });

  const filteredBuildings = useMemo(() => {
    return buildings.filter(
      (b) => String(b.facility_id) === String(form.facility_id)
    );
  }, [buildings, form.facility_id]);

  const filteredSystems = useMemo(() => {
    return buildingSystems.filter(
      (s) => String(s.building_id) === String(form.building_id)
    );
  }, [buildingSystems, form.building_id]);

  const canSubmit = useMemo(() => {
    return (
      form.facility_id.trim() &&
      form.building_id.trim() &&
      form.visit_type.trim() &&
      form.planned_date.trim() &&
      form.selected_system_ids.length > 0
    );
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFacilityChange(value: string) {
    setForm((prev) => ({
      ...prev,
      facility_id: value,
      building_id: "",
      selected_system_ids: [],
    }));
  }

  function handleBuildingChange(value: string) {
    setForm((prev) => ({
      ...prev,
      building_id: value,
      selected_system_ids: [],
    }));
  }

  function toggleSystem(id: string) {
    setForm((prev) => {
      const exists = prev.selected_system_ids.includes(id);
      return {
        ...prev,
        selected_system_ids: exists
          ? prev.selected_system_ids.filter((x) => x !== id)
          : [...prev.selected_system_ids, id],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("يرجى اختيار المنشأة والمبنى وتاريخ الزيارة ونظام واحد على الأقل.");
      return;
    }

    const selectedSystems = filteredSystems.filter((s) =>
      form.selected_system_ids.includes(String(s.building_system_id))
    );

    try {
      setSaving(true);

      const res = await fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facility_id: form.facility_id,
          building_id: form.building_id,
          visit_type: form.visit_type,
          planned_date: form.planned_date,
          due_date: form.due_date || form.planned_date,
          assigned_inspector_id: form.assigned_inspector_id,
          notes: form.notes,
          system_codes: selectedSystems.map((s) => s.system_code),
          systems: selectedSystems.map((s) => ({
            building_system_id: s.building_system_id,
            system_code: s.system_code,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إنشاء الزيارة");
      }

      setMessage("تم إنشاء الزيارة بنجاح");
      setForm({
        ...initialState,
        facility_id: facilities[0]?.facility_id || "",
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إنشاء الزيارة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-panel">
      <div className="form-panel-title">إنشاء زيارة</div>
      <div className="form-panel-text">
        أنشئ زيارة تفتيش جديدة وحدد المبنى والأنظمة الداخلة ضمن نطاقها
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-block"
        style={{ marginTop: "14px" }}
      >
        <ClipboardPlus size={18} />
        {open ? "إغلاق النموذج" : "زيارة جديدة"}
      </button>

      {message ? (
        <div className="alert-success" style={{ marginTop: "12px" }}>
          {message}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="stack-3" style={{ marginTop: "16px" }}>
          <div className="form-grid-2">
            <select
              className="field"
              value={form.facility_id}
              onChange={(e) => handleFacilityChange(e.target.value)}
            >
              <option value="">اختر المنشأة</option>
              {facilities.map((facility) => (
                <option key={facility.facility_id} value={facility.facility_id}>
                  {facility.facility_name}
                </option>
              ))}
            </select>

            <select
              className="field"
              value={form.building_id}
              onChange={(e) => handleBuildingChange(e.target.value)}
            >
              <option value="">اختر المبنى</option>
              {filteredBuildings.map((building) => (
                <option key={building.building_id} value={building.building_id}>
                  {building.building_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <select
              className="field"
              value={form.visit_type}
              onChange={(e) => updateField("visit_type", e.target.value)}
            >
              <option value="routine">زيارة دورية</option>
              <option value="followup">زيارة متابعة</option>
              <option value="reinspection">إعادة فحص</option>
              <option value="handover">استلام / تسليم</option>
            </select>

            <select
              className="field"
              value={form.assigned_inspector_id}
              onChange={(e) => updateField("assigned_inspector_id", e.target.value)}
            >
              <option value="">اختر المفتش</option>
              {inspectors.map((inspector) => (
                <option key={inspector.inspector_id} value={inspector.inspector_id}>
                  {inspector.inspector_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div>
              <div className="helper-text" style={{ marginBottom: "6px" }}>
                التاريخ المخطط
              </div>
              <input
                type="date"
                className="field"
                value={form.planned_date}
                onChange={(e) => updateField("planned_date", e.target.value)}
              />
            </div>

            <div>
              <div className="helper-text" style={{ marginBottom: "6px" }}>
                تاريخ الاستحقاق
              </div>
              <input
                type="date"
                className="field"
                value={form.due_date}
                onChange={(e) => updateField("due_date", e.target.value)}
              />
            </div>
          </div>

          <div className="system-panel">
            <div className="system-panel-top">
              <div>
                <div className="system-panel-title">أنظمة الزيارة</div>
                <div className="system-panel-count">
                  المحدد: {form.selected_system_ids.length}
                </div>
              </div>

              <div className="user-badge" style={{ width: "40px", height: "40px" }}>
                <CalendarDays size={18} />
              </div>
            </div>

            <div className="system-pick-list">
              {form.building_id && filteredSystems.length === 0 ? (
                <div className="empty-state-text">
                  لا توجد أنظمة مرتبطة بهذا المبنى
                </div>
              ) : !form.building_id ? (
                <div className="empty-state-text">
                  اختر المبنى أولًا لإظهار الأنظمة
                </div>
              ) : (
                filteredSystems.map((system) => {
                  const checked = form.selected_system_ids.includes(
                    String(system.building_system_id)
                  );

                  return (
                    <label
                      key={system.building_system_id}
                      className={`system-pick-item ${checked ? "checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleSystem(String(system.building_system_id))
                        }
                      />
                      <div>
                        <div className="system-pick-item-title">
                          {system.system_code}
                        </div>
                        <div className="system-pick-item-code">
                          {system.building_system_id}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <textarea
            className="field"
            placeholder="ملاحظات الزيارة"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          {error ? <div className="alert-error">{error}</div> : null}

          <div className="btn-row">
            <button type="submit" className="btn btn-grow" disabled={saving}>
              {saving ? "جارٍ الإنشاء..." : "حفظ الزيارة"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
