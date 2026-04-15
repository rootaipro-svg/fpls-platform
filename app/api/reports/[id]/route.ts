import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantRecord } from "@/lib/tenant";
import { buildVisitReportModel } from "@/lib/reports";
import { uploadTextFile } from "@/lib/drive";
import { appendRow } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requirePermission("reports", "create");
    const tenant = await getTenantRecord(user.tenantId);
    const model = await buildVisitReportModel(String(tenant.sheet_id), id);

    const html = `
      <html>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h1>${model.facility?.facility_name || "Facility"} - Inspection Report</h1>
        <p><strong>Visit:</strong> ${model.visit.visit_id}</p>
        <p><strong>Building:</strong> ${model.building?.building_name || ""}</p>
        <p><strong>Date:</strong> ${model.visit.visit_date || model.visit.planned_date || ""}</p>
        <h2>Systems</h2>
        <ul>
          ${model.systems.map((s: any) => `<li>${s.system_code} - ${s.result_summary}</li>`).join("")}
        </ul>
        <h2>Findings</h2>
        <ul>
          ${model.reportFindings.map((f: any) => `<li>[${f.severity}] ${f.title}: ${f.description}</li>`).join("")}
        </ul>
      </body>
      </html>
    `;

    const file = await uploadTextFile(String(tenant.drive_folder_id), `report-${id}.html`, html, "text/html");

    await appendRow(String(tenant.sheet_id), "REPORTS", {
      report_id: makeId("REP"),
      visit_id: id,
      report_title: `${model.facility?.facility_name || "Facility"} report`,
      generated_at: nowIso(),
      generated_by: user.appUserId,
      pdf_file_url: file.webViewLink || "",
      drive_file_id: file.id || "",
      report_version: "v1.0",
      status: "published",
      technical_decision: model.reportFindings.some((f: any) => String(f.severity) === "critical") ? "unsatisfactory" : "satisfactory_with_remarks",
      notes: "Generated from visit data"
    });

    return NextResponse.json({ ok: true, data: file });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
