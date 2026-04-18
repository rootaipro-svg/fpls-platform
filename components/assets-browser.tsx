"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AssetRow = {
  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_name_ar: string;
  system_code: string;
  status: string;
  facility_id: string;
  facility_name: string;
  building_id: string;
  building_name: string;
  location_note: string;
};

type Props = {
  rows: AssetRow[];
};

export default function AssetsBrowser({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");

  const systemOptions = useMemo(() => {
    return [...new Set(rows.map((r) => String(r.system_code || "")).filter(Boolean))].sort();
  }, [rows]);

  const facilityOptions = useMemo(() => {
    return [...new Set(rows.map((r) => String(r.facility_name || "")).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b, "ar")
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !q ||
        String(row.asset_name_ar || "").toLowerCase().includes(q) ||
        String(row.asset_name || "").toLowerCase().includes(q) ||
        String(row.asset_code || "").toLowerCase().includes(q) ||
        String(row.asset_id || "").toLowerCase().includes(q) ||
        String(row.location_note || "").toLowerCase().includes(q);

      const matchesSystem =
        !systemFilter || String(row.system_code || "") === systemFilter;

      const matchesStatus =
        !statusFilter || String(row.status || "") === statusFilter;

      const matchesFacility =
        !facilityFilter || String(row.facility_name || "") === facilityFilter;

      return matchesQuery && matchesSystem && matchesStatus && matchesFacility;
    });
  }, [rows, query, systemFilter, statusFilter, facilityFilter]);

  return (
    <>
      <section className="card">
        <div className="section-title">بحث وتصفية الأصول</div>
        <div className="section-subtitle">
          ابحث بالاسم أو الكود، وفلتر حسب النظام أو الحالة أو المنشأة
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "14px",
          }}
        >
          <input
            className="field"
            placeholder="ابحث باسم الأصل أو الكود أو الموقع"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className="field"
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
          >
            <option value="">كل المنشآت</option>
            {facilityOptions.map((facility) => (
              <option key={facility} value={facility}>
                {facility}
              </option>
            ))}
          </select>

          <select
            className="field"
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
          >
            <option value="">كل الأنظمة</option>
            {systemOptions.map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>

          <select
            className="field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">كل الحالات</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="out_of_service">out_of_service</option>
            <option value="retired">retired</option>
          </select>
        </div>

        <div className="badge-wrap" style={{ marginTop: "14px" }}>
          <span className="badge">النتائج: {filteredRows.length}</span>
          {query ? <span className="badge">البحث: {query}</span> : null}
          {facilityFilter ? <span className="badge">المنشأة: {facilityFilter}</span> : null}
          {systemFilter ? <span className="badge">النظام: {systemFilter}</span> : null}
          {statusFilter ? <span className="badge">الحالة: {statusFilter}</span> : null}
        </div>
      </section>

      <section className="card">
        <div className="section-title">قائمة الأصول</div>
        <div className="section-subtitle">
          فتح الأصل، عرض QR، أو البدء مباشرة من مسار الفحص
        </div>

        {filteredRows.length === 0 ? (
          <div className="muted-note" style={{ marginTop: "14px" }}>
            لا توجد نتائج مطابقة للمرشحات الحالية.
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "14px" }}>
            {filteredRows.map((asset) => (
              <div key={asset.asset_id} className="system-line">
                <div className="system-line-top">
                  <div>
                    <div className="system-line-title">
                      {String(
                        asset.asset_name_ar ||
                          asset.asset_name ||
                          asset.asset_code ||
                          asset.asset_id
                      )}
                    </div>

                    <div className="system-line-date">
                      {String(asset.asset_code || asset.asset_id || "-")}
                      {asset.system_code ? ` · ${asset.system_code}` : ""}
                      {asset.facility_name ? ` · ${asset.facility_name}` : ""}
                      {asset.building_name ? ` · ${asset.building_name}` : ""}
                      {asset.location_note ? ` · ${asset.location_note}` : ""}
                    </div>
                  </div>

                  <div className="badge-wrap">
                    <span className="badge">{String(asset.status || "active")}</span>
                  </div>
                </div>

                <div className="btn-row" style={{ marginTop: "12px" }}>
                  <Link href={`/assets/${asset.asset_id}`} className="btn btn-secondary">
                    فتح الأصل
                  </Link>

                  <Link href={`/assets/${asset.asset_id}/qr`} className="btn btn-secondary">
                    عرض QR
                  </Link>

                  <Link href={`/assets/${asset.asset_id}/inspect`} className="btn">
                    بدء فحص
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
