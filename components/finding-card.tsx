import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  formatDateLabel,
  safeText,
  toSeverityLabel,
  toStatusLabel,
} from "@/lib/display";

type FindingCardProps = {
  finding: any;
  facilityName?: string;
  buildingName?: string;
};

export function FindingCard({
  finding,
  facilityName = "",
  buildingName = "",
}: FindingCardProps) {
  const severity = String(finding.severity || "").toLowerCase();

  const severityClass =
    severity === "critical"
      ? "bg-rose-50 text-rose-700"
      : severity === "major"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return (
    <Link
      href={`/findings/${finding.finding_id}`}
      className="block rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className={`rounded-full px-4 py-2 text-sm font-bold ${severityClass}`}>
            {toSeverityLabel(finding.severity)}
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            {toStatusLabel(finding.closure_status || finding.compliance_status || "open")}
          </span>
        </div>

        <div className="flex-1 text-right">
          <div className="text-[28px] font-extrabold leading-tight text-slate-950">
            {safeText(finding.title, "مخالفة")}
          </div>

          <div className="mt-2 text-[16px] text-slate-500">
            {safeText(facilityName, "منشأة غير محددة")}
            {buildingName ? ` · ${buildingName}` : ""}
          </div>

          <div className="mt-2 text-[15px] leading-7 text-slate-500">
            {safeText(finding.description, "بدون وصف")}
          </div>

          <div className="mt-3 text-[15px] text-slate-500">
            التاريخ: {formatDateLabel(finding.created_at || finding.updated_at)}
          </div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-50 text-slate-400">
          <ChevronLeft size={20} />
        </div>
      </div>
    </Link>
  );
}
