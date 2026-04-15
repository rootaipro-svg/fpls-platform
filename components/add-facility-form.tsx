"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  facility_name: string;
  facility_name_ar: string;
  owner_name: string;
  operator_name: string;
  facility_type: string;
  occupancy_classification: string;
  city: string;
  district: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  notes: string;
};

const initialState: FormState = {
  facility_name: "",
  facility_name_ar: "",
  owner_name: "",
  operator_name: "",
  facility_type: "commercial",
  occupancy_classification: "office",
  city: "",
  district: "",
  address: "",
  contact_person: "",
  contact_phone: "",
  contact_email: "",
  notes: ""
};

const facilityTypes = [
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "residential", label: "Residential" },
  { value: "healthcare", label: "Healthcare" },
  { value: "hospitality", label: "Hospitality" },
  { value: "education", label: "Education" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "government", label: "Government" }
];

const occupancyTypes = [
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

export default function AddFacilityForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.facility_name.trim() &&
      form.city.trim() &&
      form.facility_type.trim() &&
      form.occupancy_classification.trim()
    );
  }, [form]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("Please fill the required fields.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to create facility");
      }

      setMessage("Facility created successfully ✅");
      setForm(initialState);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create facility");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Facilities</div>
          <div className="text-sm text-slate-500">
            Add a new facility directly from the app
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "+ Add Facility"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3">
            <input
              className="input"
              placeholder="Facility name *"
              value={form.facility_name}
              onChange={(e) => updateField("facility_name", e.target.value)}
            />

            <input
              className="input"
              placeholder="Facility name (Arabic)"
              value={form.facility_name_ar}
              onChange={(e) => updateField("facility_name_ar", e.target.value)}
            />

            <input
              className="input"
              placeholder="Owner name"
              value={form.owner_name}
              onChange={(e) => updateField("owner_name", e.target.value)}
            />

            <input
              className="input"
              placeholder="Operator name"
              value={form.operator_name}
              onChange={(e) => updateField("operator_name", e.target.value)}
            />

            <select
              className="select"
              value={form.facility_type}
              onChange={(e) => updateField("facility_type", e.target.value)}
            >
              {facilityTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              className="select"
              value={form.occupancy_classification}
              onChange={(e) => updateField("occupancy_classification", e.target.value)}
            >
              {occupancyTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="City *"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />

            <input
              className="input"
              placeholder="District"
              value={form.district}
              onChange={(e) => updateField("district", e.target.value)}
            />

            <textarea
              className="textarea"
              placeholder="Address"
              rows={3}
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />

            <input
              className="input"
              placeholder="Contact person"
              value={form.contact_person}
              onChange={(e) => updateField("contact_person", e.target.value)}
            />

            <input
              className="input"
              placeholder="Contact phone"
              value={form.contact_phone}
              onChange={(e) => updateField("contact_phone", e.target.value)}
            />

            <input
              className="input"
              placeholder="Contact email"
              type="email"
              value={form.contact_email}
              onChange={(e) => updateField("contact_email", e.target.value)}
            />

            <textarea
              className="textarea"
              placeholder="Notes"
              rows={3}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

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
              {saving ? "Saving..." : "Save Facility"}
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
