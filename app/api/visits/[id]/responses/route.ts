import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, updateRowById, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { calculateNextDueForVisitSystem } from "@/lib/scheduling";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("responses", "create");
    const { id } = await params;
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    const responses = Array.isArray(body.responses) ? body.responses : [];
    if (!responses.length) {
      return NextResponse.json(
        { ok: false, message: "No responses submitted" },
        { status: 400 }
      );
    }

    const existingResponses = await readSheet(workbookId, "RESPONSES");
    const existingFindings = await readSheet(workbookId, "FINDINGS");

    for (const answer of responses) {
      const existingResponse = existingResponses.find(
        (r) =>
          String(r.visit_system_id) === String(answer.visit_system_id) &&
          String(r.checklist_item_id) === String(answer.checklist_item_id)
      );

      let responseId = "";

      if (existingResponse) {
        responseId = String(existingResponse.response_id);

        await updateRowById(
          workbookId,
          "RESPONSES",
          "response_id",
          responseId,
          {
            response_value: answer.response_value,
            score_value: answer.score_value || "",
            finding_severity: answer.finding_severity || "",
            finding_flag: answer.finding_flag ? "TRUE" : "FALSE",
            comments: answer.comments || "",
            evidence_count: answer.evidence_count || 0,
            response_by: user.appUserId,
            response_at: nowIso(),
            synced_from_mobile_at: nowIso(),
            updated_at: nowIso(),
          }
        );
      } else {
        responseId = makeId("RSP");

        await appendRow(workbookId, "RESPONSES", {
          response_id: responseId,
          visit_system_id: answer.visit_system_id,
          building_system_id: answer.building_system_id,
          system_component_id: answer.system_component_id || "",
          checklist_item_id: answer.checklist_item_id,
          response_value: answer.response_value,
          score_value: answer.score_value || "",
          finding_severity: answer.finding_severity || "",
          finding_flag: answer.finding_flag ? "TRUE" : "FALSE",
          comments: answer.comments || "",
          evidence_count: answer.evidence_count || 0,
          response_by: user.appUserId,
          response_at: nowIso(),
          synced_from_mobile_at: nowIso(),
          updated_at: nowIso(),
        });
      }

      const existingFinding = existingFindings.find(
        (f) => String(f.response_id) === String(responseId)
      );

      if (answer.finding_flag) {
        if (existingFinding) {
          await updateRowById(workbookId, "FINDINGS", "finding_id", String(existingFinding.finding_id), {
            finding_code: answer.item_code || "",
            title: answer.title || "Non-compliant item",
            description: answer.comments || "",
            severity: answer.finding_severity || "major",
            compliance_status: "open",
            corrective_action: answer.corrective_action || "",
            closure_status: "open",
            verification_notes: "",
            updated_at: nowIso(),
          });
        } else {
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
            updated_at: nowIso(),
          });
        }
      } else if (existingFinding) {
        await updateRowById(workbookId, "FINDINGS", "finding_id", String(existingFinding.finding_id), {
          compliance_status: "closed",
          closure_status: "closed",
          actual_close_date: new Date().toISOString().slice(0, 10),
          closed_by: user.appUserId,
          closed_at: nowIso(),
          updated_at: nowIso(),
        });
      }
    }

    const allResponses = await readSheet(workbookId, "RESPONSES");
    const visitSystems = await readSheet(workbookId, "VISIT_SYSTEMS");

    const currentVisitSystems = visitSystems.filter(
      (vs) => String(vs.visit_id) === String(id)
    );

    const nextDueDates: string[] = [];

    for (const visitSystem of currentVisitSystems) {
      const systemResponses = allResponses.filter(
        (r) => String(r.visit_system_id) === String(visitSystem.visit_system_id)
      );

      const compliantCount = systemResponses.filter(
        (r) => String(r.response_value) === "compliant"
      ).length;

      const failResponses = systemResponses.filter(
        (r) => String(r.response_value) === "non_compliant"
      );

      const naCount = systemResponses.filter(
        (r) => String(r.response_value) === "not_applicable"
      ).length;

      const scoredTotal = compliantCount + failResponses.length;
      const compliancePercent =
        scoredTotal > 0 ? Math
