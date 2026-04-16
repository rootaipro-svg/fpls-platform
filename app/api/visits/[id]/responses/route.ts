import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet, updateRowById } from "@/lib/sheets";
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

    const submittedResponses = Array.isArray(body.responses) ? body.responses : [];
    if (submittedResponses.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No responses submitted" },
        { status: 400 }
      );
    }

    const [existingResponses, existingFindings, visitSystems] =
      await Promise.all([
        readSheet(workbookId, "RESPONSES"),
        readSheet(workbookId, "FINDINGS"),
        readSheet(workbookId, "VISIT_SYSTEMS"),
      ]);

    for (const answer of submittedResponses) {
      const matchedResponse = existingResponses.find(
        (r) =>
          String(r.visit_system_id) === String(answer.visit_system_id) &&
          String(r.checklist_item_id) === String(answer.checklist_item_id)
      );

      let responseId = "";

      if (matchedResponse) {
        responseId = String(matchedResponse.response_id);

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

      const matchedFinding = existingFindings.find(
        (f) => String(f.response_id) === String(responseId)
      );

      if (answer.finding_flag) {
        if (matchedFinding) {
          await updateRowById(
            workbookId,
            "FINDINGS",
            "finding_id",
            String(matchedFinding.finding_id),
            {
              finding_code: answer.item_code || "",
              title: answer.title || "Non-compliant item",
              description: answer.comments || "",
              severity: answer.finding_severity || "major",
              compliance_status: "open",
              corrective_action: answer.corrective_action || "",
              closure_status: "open",
              verification_notes: "",
              updated_at: nowIso(),
            }
          );
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
      } else if (matchedFinding) {
        await updateRowById(
          workbookId,
          "FINDINGS",
          "finding_id",
          String(matchedFinding.finding_id),
          {
            compliance_status: "closed",
            closure_status: "closed",
            actual_close_date: new Date().toISOString().slice(0, 10),
            closed_by: user.appUserId,
            closed_at: nowIso(),
            updated_at: nowIso(),
          }
        );
      }
    }

    const allResponses = await readSheet(workbookId, "RESPONSES");
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

      const scoredTotal = compliantCount + failResponses.length;
      const compliancePercent =
        scoredTotal > 0 ? Math.round((compliantCount / scoredTotal) * 100) : 0;

      const criticalCount = failResponses.filter(
        (r) => String(r.finding_severity) === "critical"
      ).length;

      const majorCount = failResponses.filter(
        (r) => String(r.finding_severity) === "major"
      ).length;

      const minorCount = failResponses.filter(
        (r) => String(r.finding_severity) === "minor"
      ).length;

      const resultSummary =
        failResponses.length === 0
          ? "compliant"
          : criticalCount > 0
          ? "critical_findings"
          : "non_compliant";

      const nextDue = await calculateNextDueForVisitSystem(
        workbookId,
        String(visitSystem.visit_system_id)
      );

      if (nextDue) {
        nextDueDates.push(nextDue);
      }

      await updateRowById(
        workbookId,
        "VISIT_SYSTEMS",
        "visit_system_id",
        String(visitSystem.visit_system_id),
        {
          actual_start_time:
            String(visitSystem.actual_start_time || "") || nowIso(),
          actual_end_time: nowIso(),
          result_summary: resultSummary,
          compliance_percent: compliancePercent,
          critical_count: criticalCount,
          major_count: majorCount,
          minor_count: minorCount,
          next_due_date: nextDue || "",
          status: "completed",
          updated_at: nowIso(),
        }
      );
    }

    const closedResponses = allResponses.filter((r) =>
      currentVisitSystems.some(
        (vs) => String(vs.visit_system_id) === String(r.visit_system_id)
      )
    );

    const totalCritical = closedResponses.filter(
      (r) => String(r.finding_severity) === "critical"
    ).length;

    const totalFailures = closedResponses.filter(
      (r) => String(r.response_value) === "non_compliant"
    ).length;

    const overallSummary =
      totalFailures === 0
        ? "compliant"
        : totalCritical > 0
        ? "fail_critical"
        : body.summary_result || "pass_with_remarks";

    const earliestNextDue =
      nextDueDates.length > 0 ? [...nextDueDates].sort()[0] : "";

    await updateRowById(workbookId, "VISITS", "visit_id", String(id), {
      visit_date: body.visit_date || new Date().toISOString().slice(0, 10),
      visit_status: "closed",
      summary_result: overallSummary,
      next_due_date: earliestNextDue,
      updated_at: nowIso(),
    });

    return NextResponse.json({
      ok: true,
      summary_result: overallSummary,
      next_due_date: earliestNextDue,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to save responses" },
      { status: 400 }
    );
  }
}
