"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type BuildingOption = {
  building_id: string;
  building_name: string;
};

type SystemOption = {
  system_code: string;
  system_name: string;
};

type Props = {
  buildings: BuildingOption[];
  systems: SystemOption[];
};

type FormState = {
  building_id: string;
  system_code: string;
  system_name_override: string;
  coverage_scope: string;
  protection_area: string;
  manufacturer: string;
  model: string;
  serial_no: string;
  install_date: string;
  commission_date: string;
  service_provider: string;
  approval_lab_code: string;
  criticality_class: string;
  notes: string;
};

const initialState: FormState = {
  building_id: "",
  system_code: "",
  system_name_override: "",
  coverage_scope: "",
  protection_area: "",
  manufacturer: "",
  model: "",
  serial_no: "",
  install_date: "",
  commission_date: "",
  service_provider: "",
  approval_lab_code: "UL",
  criticality_class: "primary",
  notes: ""
};

export default function AddSystemForm({ buildings, systems }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    ...initialState,
    building_id: buildings[0]?.building_id || "",
    system_code: systems[0]?.system_code || ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return form.building_id.trim() && form.system_code.trim();
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!canSubmit) {
      setError("Please select a building and system.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/systems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to create system");
      }

      setMessage("System created successfully ✅");
      setForm({
        ...initialState,
        building_id: buildings[0]?.building_id || "",
        system_code: systems[0]?.system_code || ""
      });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create system");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Systems</div>
          <div className="text-sm text-slate-500">
            Add a fire protection or life safety system to a building
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "+ Add System"}
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
            value={form.building_id}
            onChange={(e) => updateField("building_id", e.target.value)}
          >
            {buildings.map((building) => (
              <option key={building.building_id} value={building.building_id}>
                {building.building_name}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={form.system_code}
            onChange={(e) => updateField("system_code", e.target.value)}
          >
            {systems.map((system) => (
              <option key={system.system_code} value={system.system_code}>
                {system.system_name} ({system.system_code})
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="System name override"
            value={form.system_name_override}
            onChange={(e) => updateField("system_name_override", e.target.value)}
          />

          <input
            className="input"
            placeholder="Coverage scope"
            value={form.coverage_scope}
            onChange={(e) => updateField("coverage_scope", e.target.value)}
          />

          <input
            className="input"
            placeholder="Protection area"
            value={form.protection_area}
            onChange={(e) => updateField("protection_area", e.target.value)}
          />

          <input
            className="input"
            placeholder="Manufacturer"
            value={form.manufacturer}
            onChange={(e) => updateField("manufacturer", e.target.value)}
          />

          <input
            className="input"
            placeholder="Model"
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
          />

          <input
            className="input"
            placeholder="Serial number"
            value={form.serial_no}
            onChange={(e) => updateField("serial_no", e.target.value)}
          />

          <input
            className="input"
            type="date"
            placeholder="Install date"
            value={form.install_date}
            onChange={(e) => updateField("install_date", e.target.value)}
          />

          <input
            className="input"
            type="date"
            placeholder="Commission date"
            value={form.commission_date}
            onChange={(e) => updateField("commission_date", e.target.value)}
          />

          <input
            className="input"
            placeholder="Service provider"
            value={form.service_provider}
            onChange={(e) => updateField("service_provider", e.target.value)}
          />

          <input
            className="input"
            placeholder="Approval lab code"
            value={form
