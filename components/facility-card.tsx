import Link from "next/link";

export function FacilityCard({ facility }: { facility: any }) {
  return (
    <Link href={`/facilities/${facility.facility_id}`} className="card block">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold break-words">
            {facility.facility_name || "Unnamed Facility"}
          </div>

          <div className="mt-1 text-sm text-slate-500 break-words">
            {facility.city || "-"} · {facility.occupancy_classification || "-"}
          </div>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs shrink-0">
          {facility.active_status || "active"}
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-600 break-words">
        {facility.address || "No address provided"}
      </div>
    </Link>
  );
}
