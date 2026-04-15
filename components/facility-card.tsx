import Link from "next/link";

export function FacilityCard({ facility }: { facility: any }) {
  return (
    <Link href={`/facilities/${facility.facility_id}`} className="card block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">{facility.facility_name}</div>
          <div className="text-sm text-slate-500">{facility.city} · {facility.occupancy_classification}</div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{facility.active_status}</span>
      </div>
      <div className="mt-3 text-sm text-slate-600">{facility.address}</div>
    </Link>
  );
}
