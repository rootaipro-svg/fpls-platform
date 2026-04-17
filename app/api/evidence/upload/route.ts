import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(req: NextRequest) {
  try {
    await requirePermission("visits", "update");

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new Error("لم يتم اختيار ملف");
    }

    if (!ALLOWED_TYPES.includes(file.type || "")) {
      throw new Error("نوع الملف غير مسموح");
    }

    const safeName = `${Date.now()}-${file.name}`;

    const blob = await put(`evidence/${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      ok: true,
      data: {
        file_url: blob.url,
        file_name: file.name,
        pathname: blob.pathname,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "تعذر رفع الملف",
      },
      { status: 400 }
    );
  }
}
