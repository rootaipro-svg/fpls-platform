import { AlertTriangle, Building2, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
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

export default async function DashboardPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [facilities, visits, dueItems] = await Promise.all([
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "SUMMARY_DUE"),
  ]);

  const latestVisits = sortByDateDesc(visits, "visit_date").slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="لوحة التحكم"
        subtitle="متابعة المنشآت والزيارات والعناصر المستحقة"
      />

      <div className="grid grid-cols-1 gap-3">
        <StatCard
          label="المنشآت"
          value={facilities.length}
          hint="إجمالي المنشآت المسجلة"
          icon={Building2}
          tone="teal"
        />
        <StatCard
          label="العناصر المستحقة"
          value={dueItems.length}
          hint="تشمل القريب والمتأخر"
          icon={AlertTriangle}
          tone={dueItems.length > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="الزيارات"
          value={visits.length}
          hint="إجمالي الزيارات المسجلة"
          icon={ClipboardList}
          tone="slate"
        />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-lg font-bold text-slate-900">آخر الزيارات</div>

        {latestVisits.length === 0 ? (
          <EmptyState
            title="لا توجد زيارات حتى الآن"
            description="بعد إنشاء زيارة جديدة ستظهر هنا آخر الزيارات المنفذة أو المجدولة."
            icon={ClipboardList}
          />
        ) : (
          <div className="space-y-3">
            {latestVisits.map((visit) => (
              <div
                key={String(visit.visit_id)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {String(visit.visit_type || "زيارة")}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {String(visit.visit_date || visit.planned_date || "-")}
                    </div>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {String(visit.visit_status || "planned")}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  {String(visit.summary_result || visit.notes || "لا توجد ملاحظات")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
