import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { appendRow, readSheet, updateRowById } from "@/lib/sheets";
import { makeId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export async function GET() {
  try {
    const actor = await requirePermission("settings", "view");
    const rows = await readSheet(actor.workbookId, "TENANT_PROFILE");

    const row =
      rows.find((r) => String(r.tenant_id) === String(actor.tenantId)) || null;

    return NextResponse.json({ ok: true, data: row });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to load tenant profile" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requirePermission("settings", "update");
    const body = await req.json();

    const rows = await readSheet(actor.workbookId, "TENANT_PROFILE");
    const existing = rows.find(
      (r) => String(r.tenant_id) === String(actor.tenantId)
    );

    if (existing) {
      await updateRowById(
        actor.workbookId,
        "TENANT_PROFILE",
        "profile_id",
        String(existing.profile_id),
        {
          company_name_ar: body.company_name_ar || "",
          company_name_en: body.company_name_en || "",
          report_brand_name: body.report_brand_name || "",
          logo_url: body.logo_url || "",
          primary_color: body.primary_color || "#0f766e",
          contact_phone: body.contact_phone || "",
          contact_email: body.contact_email || "",
          address_line: body.address_line || "",
          city: body.city || "",
          country: body.country || "",
          authorized_signatory_name: body.authorized_signatory_name || "",
          authorized_signatory_title: body.authorized_signatory_title || "",
          report_footer_note: body.report_footer_note || "",
          stamp_note: body.stamp_note || "",
          updated_at: nowIso(),
        }
      );
    } else {
      await appendRow(actor.workbookId, "TENANT_PROFILE", {
        profile_id: makeId("TPR"),
        tenant_id: actor.tenantId,
        company_name_ar: body.company_name_ar || "",
        company_name_en: body.company_name_en || "",
        report_brand_name: body.report_brand_name || "",
        logo_url: body.logo_url || "",
        primary_color: body.primary_color || "#0f766e",
        contact_phone: body.contact_phone || "",
        contact_email: body.contact_email || "",
        address_line: body.address_line || "",
        city: body.city || "",
        country: body.country || "",
        authorized_signatory_name: body.authorized_signatory_name || "",
        authorized_signatory_title: body.authorized_signatory_title || "",
        report_footer_note: body.report_footer_note || "",
        stamp_note: body.stamp_note || "",
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to save tenant profile" },
      { status: 400 }
    );
  }
}
