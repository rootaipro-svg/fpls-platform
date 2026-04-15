import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      undefined,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.DEFAULT_TENANT_SHEET_ID;

    const values = [[
      `FAC-${Date.now()}`,
      `CODE-${Date.now()}`,
      body.name,
      body.name_ar || "",
      body.owner || "",
      body.operator || "",
      body.type || "",
      body.occupancy || "",
      body.city || "",
      body.district || "",
      body.address || "",
      "", "", "", "", "",
      "default_ksa",
      "active",
      "",
      new Date().toISOString(),
      new Date().toISOString()
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "FACILITIES!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create facility" }, { status: 500 });
  }
}
