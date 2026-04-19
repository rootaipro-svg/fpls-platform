import Link from "next/link";
import { ArrowUpLeft, MapPin } from "lucide-react";
import { toFacilityTypeLabel, safeText } from "@/lib/display";

type FacilityCardProps = {
  facility: any;
  buildingCount: number;
  systemCount: number;
  assetCount: number;
};

export function FacilityCard({
  facility,
  buildingCount,
  systemCount,
  assetCount,
}: FacilityCardProps) {
  const status = String(facility.status || "active").toLowerCase();
  const statusLabel = status === "active" ? "نشط" : "غير نشط";

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {statusLabel}
        </span>

        <div className="text-right">
          <div className="text-[34px] font-extrabold leading-tight text-slate-950">
            {safeText(facility.facility_name, "منشأة")}
          </div>

          <div className="mt-2 text-[17px] text-slate-500">
            {safeText(facility.city, "-")} · {toFacilityTypeLabel(facility.facility_type)}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 text-[15px] text-slate-500">
            <MapPin size={16} />
            <span>{safeText(facility.address, safeText(facility.district, "-"))}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-[24px] bg-slate-50 px-4 py-5 text-right">
          <div className="text-sm text-slate-500">المباني</div>
          <div className="mt-2 text-4xl font-extrabold text-slate-950">{buildingCount}</div>
        </div>

        <div className="rounded-[24px] bg-slate-50 px-4 py-5 text-right">
          <div className="text-sm text-slate-500">الأنظمة</div>
          <div className="mt-2 text-4xl font-extrabold text-slate-950">{systemCount}</div>
        </div>

        <div className="rounded-[24px] bg-slate-50 px-4 py-5 text-right">
          <div className="text-sm text-slate-500">الأصول</div>
          <div className="mt-2 text-4xl font-extrabold text-slate-950">{assetCount}</div>
        </div>
      </div>

      <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
        <Link
          href={`/facilities/${facility.facility_id}`}
          className="flex items-center justify-between text-[18px] font-bold text-teal-700"
        >
          <span>عرض المنشأة</span>
          <span className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-teal-100 bg-teal-50 text-teal-700">
            <ArrowUpLeft size={24} />
          </span>
        </Link>
      </div>
    </section>
  );
}
