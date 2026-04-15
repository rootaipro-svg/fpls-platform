import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantRecord } from "@/lib/tenant";
import { appendRow } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { getDriveClient } from "@/lib/google-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("evidence", "create");
    const tenant = await getTenantRecord(user.tenantId);
    const form = await req.formData();
    const file = form.get("file") as File;
    const visitId = String(form.get("visit_id") || "");
    const visitSystemId = String(form.get("visit_system_id") || "");
    const responseId = String(form.get("response_id") || "");
    const findingId = String(form.get("finding_id") || "");
    if (!file) throw new Error("File is required");

    const bytes = Buffer.from(await file.arrayBuffer());
    const drive = getDriveClient();
    const uploaded = await drive.files.create({
      requestBody: { name: file.name, parents: [String(tenant.drive_folder_id)] },
      media: { mimeType: file.type || "application/octet-stream", body: bytes as any },
      fields: "id,name,webViewLink"
    });

    await appendRow(String(tenant.sheet_id), "EVIDENCE", {
      evidence_id: makeId("EVD"),
      visit_id: visitId,
      visit_system_id: visitSystemId,
      response_id: responseId,
      finding_id: findingId,
      file_type: file.type,
      file_name: file.name,
drive_file_id: uploaded.data.id || "",
drive_file_url: uploaded.data.webViewLink || "",
      thumbnail_url: "",
      captured_by: user.appUserId,
      captured_at: nowIso(),
      gps_latitude: "",
      gps_longitude: "",
      notes: ""
    });

    return NextResponse.json({ ok: true, data: uploaded.data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
