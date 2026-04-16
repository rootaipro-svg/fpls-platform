import Link from "next/link";

type FacilityCardProps = {
  facility: any;
  buildingCount?: number;
  systemCount?: number;
};

export function FacilityCard({
  facility,
  buildingCount = 0,
  systemCount = 0,
}: FacilityCardProps) {
  const status = String(facility.active_status || "active");
  const isActive = status.toLowerCase() === "active";

  return (
    <Link href={`/facilities/${facility.facility_id}`} className="facility-card">
      <div className="facility-card-top">
        <div>
          <div className="facility-card-title">
            {facility.facility_name || "منشأة بدون اسم"}
          </div>
          <div className="facility-card-meta">
            {facility.city || "-"} · {facility.occupancy_classification || "-"}
          </div>
        </div>

        <span
          className={`status-pill ${
            isActive ? "status-pill--active" : "status-pill--neutral"
          }`}
        >
          {isActive ? "نشط" : status}
        </span>
      </div>

      <div className="facility-card-address">
        {facility.address || "لا يوجد عنوان مسجل"}
      </div>

      <div className="info-grid-2">
        <div className="info-mini-card">
          <div className="info-mini-label">المباني</div>
          <div className="info-mini-value">{buildingCount}</div>
        </div>

        <div className="info-mini-card">
          <div className="info-mini-label">الأنظمة</div>
          <div className="info-mini-value">{systemCount}</div>
        </div>
      </div>
    </Link>
  );
}
