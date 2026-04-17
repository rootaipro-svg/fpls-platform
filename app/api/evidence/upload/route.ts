import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const actor = await requirePermission("visits", "update");

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            tenantId: String(actor.tenantId || ""),
            appUserId: String(actor.appUserId || ""),
            role: String(actor.role || ""),
            visitId: String(clientPayload?.visitId || ""),
            visitSystemId: String(clientPayload?.visitSystemId || ""),
            checklistItemId: String(clientPayload?.checklistItemId || ""),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Evidence blob upload completed", {
          url: blob.url,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to initialize blob upload",
      },
      { status: 400 }
    );
  }
}
