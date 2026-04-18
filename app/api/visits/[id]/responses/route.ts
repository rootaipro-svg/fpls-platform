import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow, readSheet, updateRowById } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { calculateNextDueForVisitSystem } from "@/lib/scheduling";

function addDays(dateString: string, days: number) {
  const dt = new Date(String(dateString || ""));
  if (Number.isNaN(dt.getTime())) return "";
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

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

    const [existingResponses, existingFindings, visitSystems, evidence, assets] =
      await Promise.all([
        readSheet(workbookId, "RESPONSES"),
        readSheet(workbookId, "FINDINGS"),
        readSheet(workbookId, "VISIT_SYSTEMS"),
        readSheet(workbookId, "EVIDENCE"),
        readSheet(workbookId, "ASSETS"),
      ]);

    async function syncEvidenceLinks(
      visitSystemId: string,
      checklistItemId: string,
      responseId: string,
      findingId: string,
      assetId: string
    ) {
      const matchedEvidenceRows = evidence.filter(
        (row) =>
          String(row.visit_id || "") === String(id) &&
          String(row.visit_system_id || "") === String(visitSystemId) &&
          String(row.checklist_item_id || "") === String(checklistItemId) &&
          (!assetId || String(row.asset_id || "") === String(assetId))
      );

      for (const ev of matchedEvidenceRows) {
        await updateRowById(
          workbookId,
          "EVIDENCE",
          "evidence_id",
          String(ev.evidence_id),
          {
            response_id: responseId || "",
            finding_id: findingId || "",
            asset_id: assetId || "",
            updated_at: nowIso(),
          }
        );
      }
    }

    for (const answer of submittedResponses) {
      const responseValue = String(answer.response_value || "").toLowerCase();
      const isFinding =
        Boolean(answer.finding_flag) || responseValue === "non_compliant";

      const matchedResponse = existingResponses.find(
        (r) =>
          String(r.visit_system_id) === String(answer.visit_system_id) &&
          String(r.checklist_item_id) === String(answer.checklist_item_id) &&
          String(r.asset_id || "") === String(answer.asset_id || "")
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
            finding_flag: isFinding ? "TRUE" : "FALSE",
            comments: answer.comments || "",
            asset_id: String(answer.asset_id || ""),
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
          building_system_id: answer.building_system_id || "",
          system_component_id: answer.system_component_id || "",
          asset_id: String(answer.asset_id || ""),
          checklist_item_id: answer.checklist_item_id,
          response_value: answer.response_value,
          score_value: answer.score_value || "",
          finding_severity: answer.finding_severity || "",
          finding_flag: isFinding ? "TRUE" : "FALSE",
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

      if (isFinding) {
        let findingId = "";

        if (matchedFinding) {
          findingId = String(matchedFinding.finding_id);

          await updateRowById(
            workbookId,
            "FINDINGS",
            "finding_id",
            findingId,
            {
              finding_code: answer.item_code || "",
              title: answer.title || "Non-compliant item",
              description: answer.comments || "",
              severity: answer.finding_severity || "major",
              asset_id: String(answer.asset_id || ""),
              compliance_status: "open",
              corrective_action: answer.corrective_action || "",
              closure_status: "open",
              verification_notes: "",
              updated_at: nowIso(),
            }
          );
        } else {
          findingId = makeId("FND");

          await appendRow(workbookId, "FINDINGS", {
            finding_id: findingId,
            visit_system_id: answer.visit_system_id,
            asset_id: String(answer.asset_id || ""),
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

        await syncEvidenceLinks(
          String(answer.visit_system_id || ""),
          String(answer.checklist_item_id || ""),
          responseId,
          findingId,
          String(answer.asset_id || "")
        );
      } else {
        if (matchedFinding) {
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

        await syncEvidenceLinks(
          String(answer.visit_system_id || ""),
          String(answer.checklist_item_id || ""),
          responseId,
          "",
          String(answer.asset_id || "")
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

    const effectiveVisitDate =
      String(body.visit_date || "").trim() ||
      new Date().toISOString().slice(0, 10);

    await updateRowById(workbookId, "VISITS", "visit_id", String(id), {
      visit_date: effectiveVisitDate,
      visit_status: "closed",
      summary_result: overallSummary,
      next_due_date: earliestNextDue,
      updated_at: nowIso(),
    });

    const touchedAssetIds = [
  ...new Set(
    submittedResponses
      .map((row: any) => String(row.asset_id || "").trim())
      .filter(Boolean)
  ),
];

    for (const assetId of touchedAssetIds) {
      const asset = assets.find((row) => String(row.asset_id || "") === assetId);
      if (!asset) continue;

      const intervalDays = Number(asset.inspection_interval_days || 0);
      const computedNextDue =
        intervalDays > 0 ? addDays(effectiveVisitDate, intervalDays) : "";

      await updateRowById(workbookId, "ASSETS", "asset_id", assetId, {
        last_inspected_at: effectiveVisitDate,
        next_due_date: computedNextDue || String(asset.next_due_date || ""),
        updated_at: nowIso(),
      });
    }

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
