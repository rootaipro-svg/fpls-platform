import { AppShell } from "@/components/app-shell";
import { ChecklistItem } from "@/components/checklist-item";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";
import { getChecklistForSystem } from "@/lib/checklist";

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);
  const [visits, visitSystems] = await Promise.all([
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS")
  ]);

  const visit = visits.find(v => String(v.visit_id) === id);
  const systems = visitSystems.filter(vs => String(vs.visit_id) === id);
  const firstSystemCode = String(systems[0]?.system_code || "");
  const checklist = firstSystemCode ? await getChecklistForSystem(workbookId, firstSystemCode) : [];

  return (
    <AppShell title={`Visit ${id}`}>
      <div className="card">
        <div className="text-sm text-slate-500">Summary</div>
        <div className="mt-1 font-medium">{String(visit?.summary_result || "")}</div>
        <div className="mt-1 text-sm text-slate-500">{String(visit?.notes || "")}</div>
      </div>

      <div className="card">
        <div className="text-lg font-semibold">Systems in this visit</div>
        <div className="mt-3 space-y-2">
          {systems.map((s) => (
            <div key={String(s.visit_system_id)} className="rounded-xl border border-slate-200 p-3">
              <div className="font-medium">{String(s.system_code)}</div>
              <div className="text-sm text-slate-500">Compliance {String(s.compliance_percent || "0")}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {checklist.slice(0, 10).map((item) => (
          <ChecklistItem key={String(item.checklist_item_id)} item={item} />
        ))}
      </div>
    </AppShell>
  );
}
