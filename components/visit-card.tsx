import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  formatDateLabel,
  safeText,
  toStatusLabel,
  toVisitTypeLabel,
} from "@/lib/display";

type VisitCardProps = {
  visit: any;
  facilityName?: string;
  buildingName?: string;
};

export function VisitCard({
  visit,
  facilityName = "",
  buildingName = "",
}: VisitCardProps) {
  const status = String(visit.visit_status || "planned").toLowerCase();

  const statusClass =
    status === "closed" || status === "completed"
      ? "bg-slate-100 text-slate-700"
      : status === "in_progress" || status === "open"
      ? "bg-sky-50 text-sky-700"
      : "bg-slate-100 text-slate-600";

  return (
    <Link
      href={`/visits/${visit.visit_id}`}
      className="block rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusClass}`}>
          {toStatusLabel(visit.visit_status)}
        </span>

        <div className="flex-1 text-right">
          <div className="text-[30px] font-extrabold leading-tight text-slate-950">
            {toVisitTypeLabel(visit.visit_type)}
          </div>

          <div className="mt-2 text-[17px] text-slate-500">
            {safeText(facilityName, "منشأة غير محددة")}
            {buildingName ? ` · ${buildingName}` : ""}
          </div>

          <div className="mt-2 text-[16px] text-slate-500">
            التاريخ: {formatDateLabel(visit.planned_date || visit.visit_date)}
          </div>

          <div className="mt-3 text-[15px] leading-7 text-slate-500">
            {safeText(visit.notes || visit.summary_result, "بدون وصف")}
          </div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-50 text-slate-400">
          <ChevronLeft size={20} />
        </div>
      </div>
    </Link>
  );
}
