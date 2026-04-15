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
  const [form, setForm] = useState<FormState>({
    ...initialState,
    facility_id: facilities[0]?.facility_id || ""
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.facility_id.trim() &&
      form.building_name.trim() &&
      form.building_use.trim() &&
      form.occupancy_profile_id.trim() &&
      form.risk_profile_id.trim()
    );
  }, [form]);

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
        `Building created successfully ✅${data.data?.systems_created ? ` (${data.data.systems_created} systems added)` : ""}`
      );
      setForm({
        ...initialState,
        facility_id: facilities[0]?.facility_id || ""
      });
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
