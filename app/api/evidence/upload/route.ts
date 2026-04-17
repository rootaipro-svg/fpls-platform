import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { requirePermission } from "@/lib/permissions";

function getDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Drive credentials are missing");
  }

  const auth = new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey,
    ["https://www.googleapis.com/auth/drive"]
  );

  return google.drive({ version: "v3", auth });
}

function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer);
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("visits", "update");

    const folderId = process.env.GOOGLE_DRIVE_EVIDENCE_FOLDER_ID;
    if (!folderId) {
      throw new Error("GOOGLE_DRIVE_EVIDENCE_FOLDER_ID is missing");
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new Error("No file uploaded");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const drive = getDriveClient();

    const created = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: bufferToStream(bytes),
      },
      fields: "id,name,mimeType",
    });

    const fileId = created.data.id;
    if (!fileId) {
      throw new Error("Failed to upload file");
    }

    await drive.permissions.create({
      fileId,
      requestBody: {
        type: "anyone",
        role: "reader",
      },
    });

    const fileUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return NextResponse.json({
      ok: true,
      data: {
        file_id: fileId,
        file_name: created.data.name || file.name,
        file_url: fileUrl,
        download_url: downloadUrl,
        mime_type: created.data.mimeType || file.type || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Failed to upload evidence",
      },
      { status: 400 }
    );
  }
}
