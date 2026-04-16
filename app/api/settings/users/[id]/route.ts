import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { updateRowById } from "@/lib/sheets";
import { nowIso } from "@/lib/dates";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("users", "update");
    const { id } = await params;
    const body = await req.json();

    const role = String(body.role || "inspector").toLowerCase();
    const accountStatus = String(body.account_status || "active").toLowerCase();

    if (!["admin", "reviewer", "inspector"].includes(role)) {
      return NextResponse.json(
        { ok: false, message: "Invalid role" },
        { status: 400 }
      );
    }

    if (!["active", "disabled"].includes(accountStatus)) {
      return NextResponse.json(
        { ok: false, message: "Invalid account status" },
        { status: 400 }
      );
    }

    await updateRowById(actor.workbookId, "USERS", "app_user_id", String(id), {
      role,
      account_status: accountStatus,
      updated_at: nowIso(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "Failed to update user" },
      { status: 400 }
    );
  }
}
