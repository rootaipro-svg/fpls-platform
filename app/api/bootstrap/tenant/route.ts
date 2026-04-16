import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDriveClient, getSheetsClient } from "@/lib/google-auth";
import { env } from "@/lib/env";
import { createFolder } from "@/lib/drive";
import { appendRow, readSheet } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

const TEMPLATE_SHEETS = [
  "README","TENANT_META","APP_CONFIG","LOOKUPS","APPROVAL_LABS","STANDARDS_REF","SYSTEMS_REF","COMPONENTS_REF","OCCUPANCY_PROFILES","RISK_PROFILES","AUTHORITY_PROFILES","FACILITIES","BUILDINGS","BUILDING_ZONES","BUILDING_SYSTEMS","SYSTEM_COMPONENTS","INSPECTORS","APP_USERS","ROLE_PERMISSIONS","INSPECTOR_CERTIFICATIONS","INSPECTOR_AUTH_SCOPE","FREQUENCY_RULES","CHECKLIST_TEMPLATES","VISITS","VISIT_SYSTEMS","RESPONSES","FINDINGS","EVIDENCE","DOCUMENTS","WORK_ORDERS","REPORTS","REMINDERS_QUEUE","AUDIT_LOG","SYNC_QUEUE","SUMMARY_DASHBOARD","SUMMARY_DUE"
];

export async function POST(req: NextRequest) {
  try {
    await getSessionUser();
    const body = await req.json();
    const tenantId = makeId("TEN");
    const tenantCode = body.tenant_code || tenantId;

    const sheets = getSheetsClient();
    const workbook = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `FPLS-${tenantCode}` },
        sheets: TEMPLATE_SHEETS.map((title) => ({ properties: { title } }))
      }
    });

    const spreadsheetId = workbook.data.spreadsheetId!;
    const folder = await createFolder(`FPLS-${tenantCode}`, env.driveRootFolderId);

    await appendRow(env.controlSheetId, "TENANTS", {
      tenant_id: tenantId,
      tenant_code: tenantCode,
      company_name: body.company_name,
      company_name_ar: body.company_name_ar || "",
      status: "active",
      plan_code: body.plan_code || "professional",
      primary_domain: body.primary_domain || "",
      sheet_id: spreadsheetId,
      drive_folder_id: folder.id || "",
      timezone: body.timezone || "Asia/Riyadh",
      locale: body.locale || "en-SA",
      country_code: "SA",
      city: body.city || "",
      contact_name: body.contact_name || "",
      contact_phone: body.contact_phone || "",
      contact_email: body.contact_email || "",
      billing_start_date: body.billing_start_date || "",
      billing_end_date: body.billing_end_date || "",
      max_users: body.max_users || 25,
      max_facilities: body.max_facilities || 100,
      notes: "",
      created_at: nowIso(),
      updated_at: nowIso()
    });

    return NextResponse.json({ ok: true, tenantId, spreadsheetId, driveFolderId: folder.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }
}
