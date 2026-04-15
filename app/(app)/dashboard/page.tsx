import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [facilities, visits, due] = await Promise.all([
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "SUMMARY_DUE")
  ]);

  const latestVisits = visits.slice(-5).reverse();

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Facilities" value={facilities.length} />
        <StatCard label="Open due items" value={due.filter(d => String(d.status) !== "closed").length} />
      </div>

      <div className="card">
        <div className="mb-3 text-lg font-semibold">Latest visits</div>
        <div className="space-y-3">
          {latestVisits.map((v) => (
            <a key={String(v.visit_id)} href={`/visits/${v.visit_id}`} className="block rounded-xl border border-slate-200 p-3">
              <div className="font-medium">{String(v.visit_id)}</div>
              <div className="text-sm text-slate-500">{String(v.visit_date)} · {String(v.summary_result)}</div>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
