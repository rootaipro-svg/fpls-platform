import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function VisitsPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);
  const visits = await readSheet(workbookId, "VISITS");

  const sortedVisits = sortByDateDesc(visits, "visit_date");

  return (
    <AppShell>
      <PageHeader
        title="الزيارات"
        subtitle="استعراض الزيارات المجدولة والمنفذة"
      />

      {sortedVisits.length === 0 ? (
        <EmptyState
          title="لا توجد زيارات"
          description="بعد إنشاء زيارة جديدة ستظهر هنا قائمة الزيارات الخاصة بالمنشآت والأنظمة."
          icon={ClipboardList}
        />
      ) : (
        <div className="space-y-3">
          {sortedVisits.map((visit) => (
            <Link
              key={String(visit.visit_id)}
              href={`/visits/${visit.visit_id}`}
              className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-bold text-slate-900">
                    {String(visit.visit_type || "زيارة")}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {String(visit.visit_date || visit.planned_date || "-")}
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {String(visit.visit_status || "planned")}
                </span>
              </div>

              <div className="mt-3 text-sm text-slate-600">
                {String(visit.summary_result || visit.notes || "لا توجد ملاحظات")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
