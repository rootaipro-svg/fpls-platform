"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FacilityOption = {
  facility_id: string;
  facility_name: string;
};

type SystemOption = {
  system_code: string;
  system_name: string;
};

type Props = {
  facilities: FacilityOption[];
  systems: SystemOption[];
};

type FormState = {
  facility_id: string;
  building_name: string;
  building_name_ar: string;
  building_use: string;
  construction_type: string;
  number_of_floors: string;
  basement_count: string;
  building_height_m: string;
  area_m2: string;
  occupancy_profile_id: string;
  risk_profile_id: string;
  year_built: string;
  civil_defense_permit_no: string;
  evacuation_strategy: string;
  notes: string;
  system_codes: string[];
};

const initialState: FormState = {
  facility_id: "",
  building_name: "",
  building_name_ar: "",
  building_use: "office",
  construction_type: "concrete",
  number_of_floors: "1",
  basement_count: "0",
  building_height_m: "",
  area_m2: "",
  occupancy_profile_id: "office",
  risk_profile_id: "ordinary",
  year_built: "",
  civil_defense_permit_no: "",
  evacuation_strategy: "",
  notes: "",
  system_codes: []
};

const buildingUses = [
  { value: "office", label: "Office" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "warehouse", label: "Warehouse" },
  { value: "residential", label: "Residential" },
  { value: "hospital", label: "Hospital" },
  { value: "hotel", label: "Hotel" },
  { value: "school", label: "School" },
  { value: "mixed_use", label: "Mixed Use" }
];

const occupancyProfiles = [
  { value: "office", label: "Office" },
  { value: "mercantile", label: "Mercantile" },
  { value: "assembly", label: "Assembly" },
  { value: "industrial", label: "Industrial" },
  { value: "storage", label: "Storage" },
  { value: "residential_highrise", label: "Residential High-rise" },
  { value: "residential_lowrise", label: "Residential Low-rise" },
  { value: "healthcare", label: "Healthcare" },
  { value: "educational", label: "Educational" },
  { value: "hotel", label: "Hotel" },
  { value: "mixed_use", label: "Mixed Use" }
];

const riskProfiles = [
  { value: "ordinary", label: "Ordinary" },
  { value: "light_hazard", label: "Light Hazard" },
  { value: "ordinary_group1", label: "Ordinary Group 1" },
  { value: "ordinary_group2", label: "Ordinary Group 2" },
  { value: "extra_hazard_group1", label: "Extra Hazard Group 1" },
  { value: "extra_hazard_group2", label: "Extra Hazard Group 2" },
  { value: "special_hazard", label: "Special Hazard" }
];

export default function AddBuildingForm({ facilities, systems }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [systemSearch, setSystemSearch] = useState("");

  const [form, setForm] = useState<FormState>({
    ...initialState,
    facility_id: facilities[0]?.facility_id || ""
  });

  const canSubmit = useMemo(() => {
    return (
      form.facility_id.trim() &&
      form.building_name.trim() &&
      form.building_use.trim() &&
      form.occupancy_profile_id.trim() &&
      form.risk_profile_id.trim()
    );
  }, [form]);

  const filteredSystems = useMemo(() => {
    const q = systemSearch.trim().toLowerCase();
    if (!q) return systems;

    return systems.filter((system) => {
      const name = system.system_name.toLowerCase();
      const code = system.system_code.toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [systems, systemSearch]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSystem(systemCode: string) {
    setForm((prev) => {
      const exists = prev.system_codes.includes(systemCode);
      return {
        ...prev,
        system_codes: exists
          ? prev.system_codes.filter((code) => code !== systemCode)
          : [...prev.system_codes, systemCode]
      };
    });
  }

  function selectAllFiltered() {
    setForm((prev) => {
      const merged = new Set([...prev.system_codes, ...filteredSystems.map((s) => s.system_code)]);
      return {
        ...prev,
        system_codes: Array.from(merged)
      };
    });
  }

  function clearAllSystems() {
    setForm((prev) => ({
      ...prev,
      system_codes: []
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("Please fill the required fields.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/buildings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to create building");
      }

      setMessage(
        `Building created successfully ✅${
          data.data?.systems_created
            ? ` (${data.data.systems_created} systems added)`
            : ""
        }`
      );

      setForm({
        ...initialState,
        facility_id: facilities[0]?.facility_id || ""
      });

      setSystemSearch("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create building");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Buildings</div>
          <div className="text-sm text-slate-500">
            Add a building and choose the systems installed in it
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "+ Add Building"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <select
            className="select"
            value={form.facility_id}
            onChange={(e) => updateField("facility_id", e.target.value)}
          >
            {facilities.map((facility) => (
              <option key={facility.facility_id} value={facility.facility_id}>
                {facility.facility_name}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Building name *"
            value={form.building_name}
            onChange={(e) => updateField("building_name", e.target.value)}
          />

          <input
            className="input"
            placeholder="Building name (Arabic)"
            value={form.building_name_ar}
            onChange={(e) => updateField("building_name_ar", e.target.value)}
          />

          <select
            className="select"
            value={form.building_use}
            onChange={(e) => updateField("building_use", e.target.value)}
          >
            {buildingUses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Construction type"
            value={form.construction_type}
            onChange={(e) => updateField("construction_type", e.target.value)}
          />

          <input
            className="input"
            placeholder="Number of floors"
            type="number"
            value={form.number_of_floors}
            onChange={(e) => updateField("number_of_floors", e.target.value)}
          />

          <input
            className="input"
            placeholder="Basement count"
            type="number"
            value={form.basement_count}
            onChange={(e) => updateField("basement_count", e.target.value)}
          />

          <input
            className="input"
            placeholder="Building height (m)"
            value={form.building_height_m}
            onChange={(e) => updateField("building_height_m", e.target.value)}
          />

          <input
            className="input"
            placeholder="Area (m²)"
            value={form.area_m2}
            onChange={(e) => updateField("area_m2", e.target.value)}
          />

          <select
            className="select"
            value={form.occupancy_profile_id}
            onChange={(e) => updateField("occupancy_profile_id", e.target.value)}
          >
            {occupancyProfiles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={form.risk_profile_id}
            onChange={(e) => updateField("risk_profile_id", e.target.value)}
          >
            {riskProfiles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Installed Systems
                </div>
                <div className="text-xs text-slate-500">
                  Selected: {form.system_codes.length}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                  onClick={selectAllFiltered}
                >
                  Select filtered
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                  onClick={clearAllSystems}
                >
                  Clear
                </button>
              </div>
            </div>

            <input
              className="input mt-3"
              placeholder="Search systems by name or code"
              value={systemSearch}
              onChange={(e) => setSystemSearch(e.target.value)}
            />

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredSystems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                  No matching systems found
                </div>
              ) : (
                filteredSystems.map((system) => {
                  const checked = form.system_codes.includes(system.system_code);

                  return (
                    <label
                      key={system.system_code}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                        checked
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0"
                        checked={checked}
                        onChange={() => toggleSystem(system.system_code)}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium break-words text-slate-900">
                          {system.system_name}
                        </div>
                        <div className="mt-1 text-xs break-all text-slate-500">
                          {system.system_code}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <input
            className="input"
            placeholder="Year built"
            value={form.year_built}
            onChange={(e) => updateField("year_built", e.target.value)}
          />

          <input
            className="input"
            placeholder="Civil Defense permit number"
            value={form.civil_defense_permit_no}
            onChange={(e) =>
              updateField("civil_defense_permit_no", e.target.value)
            }
          />

          <input
            className="input"
            placeholder="Evacuation strategy"
            value={form.evacuation_strategy}
            onChange={(e) => updateField("evacuation_strategy", e.target.value)}
          />

          <textarea
            className="textarea"
            placeholder="Notes"
            rows={3}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              className="btn"
              disabled={saving}
              style={{ flex: 1 }}
            >
              {saving ? "Saving..." : "Save Building"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
