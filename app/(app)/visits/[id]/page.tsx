import { ClipboardList, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";
import { getChecklistForSystem } from "@/lib/checklist";

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [visits, visitSystems] = await Promise.all([
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
  ]);

  const visit = visits.find((v) => String(v.visit_id) === id);
  const systems = visitSystems.filter((vs) => String(vs.visit_id) === id);

  const firstSystemCode = String(systems[0]?.system_code || "");
  const checklist = firstSystemCode
    ? await getChecklistForSystem(workbookId, firstSystemCode)
    : [];

  return (
    <AppShell>
      <PageHeader
        title={`الزيارة ${id}`}
        subtitle="تفاصيل الزيارة والأنظمة المرتبطة بها"
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium text-slate-500">ملخص الزيارة</div>
        <div className="mt-2 text-lg font-bold text-slate-900">
          {String(visit?.summary_result || "pending")}
        </div>
        <div className="mt-2 text-sm text-slate-600">
          {String(visit?.notes || "لا توجد ملاحظات")}
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-teal-700" />
          الأنظمة ضمن الزيارة
        </div>

        {systems.length === 0 ? (
          <EmptyState
            title="لا توجد أنظمة مرتبطة"
            description="لم يتم ربط أي نظام بهذه الزيارة بعد."
            icon={ShieldCheck}
          />
        ) : (
          <div className="space-y-3">
            {systems.map((s) => (
              <div
                key={String(s.visit_system_id)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-sm font-bold text-slate-900">
                  {String(s.system_code)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  نسبة الامتثال: {String(s.compliance_percent || "0")}%
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
          <ClipboardList className="h-5 w-5 text-teal-700" />
          قائمة الفحص
        </div>

        {checklist.length === 0 ? (
          <EmptyState
            title="لا توجد قائمة فحص"
            description="لم يتم العثور على Checklist لهذا النظام بعد."
            icon={ClipboardList}
          />
        ) : (
          <div className="space-y-3">
            {checklist.slice(0, 10).map((item) => (
              <div
                key={String(item.checklist_item_id)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="mb-1 text-xs font-medium text-slate-500">
                  {String(item.section_name || "Section")}
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {String(item.question_text || "")}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {String(item.acceptance_criteria || "")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
