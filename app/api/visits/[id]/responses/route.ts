import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, updateRowById, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { calculateNextDueForVisitSystem } from "@/lib/scheduling";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("responses", "create");
    const { id } = await params;
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    for (const answer of body.responses) {
      const responseId = makeId("RSP");
      await appendRow(workbookId, "RESPONSES", {
        response_id: responseId,
        visit_system_id: answer.visit_system_id,
        building_system_id: answer.building_system_id,
        system_component_id: answer.system_component_id || "",
        checklist_item_id: answer.checklist_item_id,
        response_value: answer.response_value,
        score_value: answer.score_value || "",
        finding_severity: answer.finding_severity || "",
        finding_flag: !!answer.finding_flag,
        comments: answer.comments || "",
        evidence_count: answer.evidence_count || 0,
        response_by: user.appUserId,
        response_at: nowIso(),
        synced_from_mobile_at: nowIso(),
        updated_at: nowIso()
      });

      if (answer.finding_flag) {
        await appendRow(workbookId, "FINDINGS", {
          finding_id: makeId("FND"),
          visit_system_id: answer.visit_system_id,
          response_id: responseId,
          finding_code: answer.item_code || "",
          title: answer.title || "Non-compliant item",
          description: answer.comments || "",
          severity: answer.finding_severity || "major",
          compliance_status: "open",
          corrective_action: answer.corrective_action || "",
          responsible_party: "",
          target_close_date: "",
          actual_close_date: "",
          closure_status: "open",
          verification_notes: "",
          closed_by: "",
          closed_at: "",
          created_at: nowIso(),
          updated_at: nowIso()
        });
      }
    }

    const nextDue = body.primary_visit_system_id ? await calculateNextDueForVisitSystem(workbookId, body.primary_visit_system_id) : null;

    if (body.primary_visit_system_id && nextDue) {
      await updateRowById(workbookId, "VISIT_SYSTEMS", "visit_system_id", body.primary_visit_system_id, {
        next_due_date: nextDue,
        status: "completed",
        updated_at: nowIso()
      });
    }

    await updateRowById(workbookId, "VISITS", "visit_id", id, {
      visit_date: body.visit_date || new Date().toISOString().slice(0, 10),
      visit_status: "closed",
      summary_result: body.summary_result || "pass_with_remarks",
      next_due_date: nextDue || "",
      updated_at: nowIso()
    });

    return NextResponse.json({ ok: true, nextDue });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
