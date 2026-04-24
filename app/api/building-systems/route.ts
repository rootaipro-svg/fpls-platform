import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getTenantWorkbookId } from "@/lib/tenant";
import { appendRow } from "@/lib/sheets";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function getAppBaseUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const origin = req.headers.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  return "https://fpls-platform.vercel.app";
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("facilities", "view");
    const workbookId = await getTenantWorkbookId(user.tenantId);
    const body = await req.json();

    const buildingId = text(body.building_id);
    const systemCode = text(body.system_code);

    if (!buildingId) {
      throw new Error("building_id is required");
    }

    if (!systemCode) {
      throw new Error("system_code is required");
    }

    const buildingSystemId = makeId("BSYS");
    const appBaseUrl = getAppBaseUrl(req);

    const systemName =
      text(body.system_name_override) ||
      text(body.system_name) ||
      systemCode;

    const qrEnabled =
      body.qr_enabled === false || text(body.qr_enabled).toUpperCase() === "FALSE"
        ? "FALSE"
        : "TRUE";

    const qrUrl =
      text(body.qr_url) || `${appBaseUrl}/systems/${buildingSystemId}`;

    const qrLabel =
      text(body.qr_label) ||
      `${systemName} - ${text(body.protection_area || body.coverage_scope || buildingId)}`;

    const timestamp = nowIso();

    await appendRow(workbookId, "BUILDING_SYSTEMS", {
      building_system_id: buildingSystemId,
      building_id: buildingId,
      system_instance_code:
        text(body.system_instance_code) ||
        `${systemCode}-${buildingSystemId.replace("BSYS-", "").slice(0, 6)}`,
      system_code: systemCode,
      system_name_override: text(body.system_name_override),
      coverage_scope: text(body.coverage_scope),
      protection_area: text(body.protection_area),
      standard_profile: text(body.standard_profile),
      authority_profile_id: text(body.authority_profile_id),
      manufacturer: text(body.manufacturer),
      model: text(body.model),
      serial_no: text(body.serial_no),
      install_date: text(body.install_date),
      commission_date: text(body.commission_date),
      service_provider: text(body.service_provider),
      approval_lab_code: text(body.approval_lab_code),
      criticality_class: text(body.criticality_class),
      system_status: text(body.system_status || "active"),
      next_inspection_anchor_date: text(body.next_inspection_anchor_date),
      notes: text(body.notes),
      created_at: timestamp,
      updated_at: timestamp,

      // QR fields
      qr_enabled: qrEnabled,
      qr_url: qrUrl,
      qr_label: qrLabel,
    });

    return NextResponse.json({
      ok: true,
      buildingSystemId,
      qrUrl,
      qrLabel,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Failed to create building system",
      },
      { status: 400 }
    );
  }
}
