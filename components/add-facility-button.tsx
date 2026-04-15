"use client";

import { useState } from "react";

export default function AddFacilityButton() {
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);

    try {
      await fetch("/api/facilities/create", {
        method: "POST",
        body: JSON.stringify({
          name: "New Facility",
          city: "Muscat",
        }),
      });

      alert("Facility Created ✅");

      // 🔥 تحديث الصفحة
      window.location.reload();

    } catch (err) {
      alert("Error creating facility ❌");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleAdd}
      style={{
        background: "#2563eb",
        color: "white",
        padding: "12px",
        borderRadius: "10px",
        width: "100%",
        fontSize: "16px",
        marginBottom: "15px",
      }}
    >
      {loading ? "Creating..." : "+ Add Facility"}
    </button>
  );
}
