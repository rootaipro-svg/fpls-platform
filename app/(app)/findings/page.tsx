import { CheckCircle2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FindingCard } from "@/components/finding-card";
import { StatCard } from "@/components/stat-card";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function sortFindings(rows: any[]) {
  return [...rows].sort((a, b) => {
    const aClosed = String(a?.closure_status || a?.compliance_status || "").toLowerCase() === "closed";
    const bClosed = String(b?.closure_status || b?.compliance_status || "").toLowerCase() === "closed";

    if (aClosed !== bClosed) {
      return aClosed ? 1 : -1;
    }

    const aTime = new Date(String(a?.updated_at || a?.created_at || 0)).getTime();
    const bTime = new Date(String(b?.updated_at || b?.created_at || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function FindingsPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [findings, visitSystems, visits, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const sortedFindings = sortFindings(findings);

  const openCount = findings.filter(
    (f) => String(f.closure_status || f.compliance_status || "").toLowerCase() !== "closed"
  ).length;

  const closedCount = findings.filter(
    (f) => String(f.closure_status || f.compliance_status || "").toLowerCase() === "closed"
  ).length;

  return (
    <AppShell>
      <PageHeader
        title
