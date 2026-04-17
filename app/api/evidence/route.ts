import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { appendRow } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("visits", "update");
    const workbookId = actor.workbookId;
    const body = await req.json();

    if (!String(body.visit_id || "").trim()) {
      throw new Error("visit_id is required");
    }

    if (!String(body.visit_system_id || "").trim()) {
      throw new Error("visit_system_id is required");
    }

    if (!String(body.checklist_item_id || "").trim()) {
      throw new Error("checklist_item_id is required");
    }

    if (!String(body.file_url || "").trim()) {
      throw new Error("file_url is required");
    }

    const timestamp = nowIso();
    const evidenceId = makeId("EVD");

    await appendRow(workbookId, "EVIDENCE", {
      evidence_id: evidenceId,
      visit_id: String(body.visit_id || ""),
      visit_system_id: String(body.visit_system_id || ""),
      finding_id: String(body.finding_id || ""),
      checklist_item_id: String(body.checklist_item_id || ""),
      response_id: String(body.response_id || ""),
      evidence_type: String(body.evidence_type || "image"),
      file_url: String(body.file_url || ""),
      file_name: String(body.file_name || ""),
      caption: String(body.caption || ""),
      taken_by: String(body.taken_by || actor.fullName || actor.email || ""),
      taken_at: String(body.taken_at || timestamp),
      created_at: timestamp,
      updated_at: timestamp,
    });

    return NextResponse.json({
      ok: true,
      data: {
        evidence_id: evidenceId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to create evidence",
      },
      { status: 400 }
    );
  }
}
