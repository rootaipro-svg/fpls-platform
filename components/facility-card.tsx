import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

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
    <Link
      href={`/facilities/${facility.facility_id}`}
      className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="break-words text-lg font-bold text-slate-900">
            {facility.facility_name || "منشأة بدون اسم"}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {facility.city || "-"} · {facility.occupancy_classification || "-"}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {isActive ? "نشط" : status}
        </span>
      </div>

      <div className="mt-3 break-words text-sm text-slate-600">
        {facility.address || "لا يوجد عنوان مسجل"}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium">المباني</span>
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">{buildingCount}</div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-medium">الأنظمة</span>
          </div>
          <div className="mt-1 text-lg font-bold text-slate-900">{systemCount}</div>
        </div>
      </div>
    </Link>
  );
}
