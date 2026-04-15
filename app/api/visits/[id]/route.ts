import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission("visits", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const [visits, visitSystems, findings] = await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "FINDINGS")
    ]);

    const visit = visits.find(v => String(v.visit_id) === id);
    const systems = visitSystems.filter(vs => String(vs.visit_id) === id);
    const ids = new Set(systems.map(s => String(s.visit_system_id)));
    const relatedFindings = findings.filter(f => ids.has(String(f.visit_system_id)));

    return NextResponse.json({ ok: true, data: { visit, systems, findings: relatedFindings } });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 403 });
  }
}
