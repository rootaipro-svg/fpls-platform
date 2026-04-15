import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function VisitsPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);
  const visits = await readSheet(workbookId, "VISITS");

  return (
    <AppShell title="Visits">
      {visits.slice().reverse().map((visit) => (
        <Link key={String(visit.visit_id)} href={`/visits/${visit.visit_id}`} className="card block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{String(visit.visit_id)}</div>
              <div className="text-sm text-slate-500">{String(visit.visit_date)} · {String(visit.visit_type)}</div>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{String(visit.visit_status)}</span>
          </div>
        </Link>
      ))}
    </AppShell>
  );
}
