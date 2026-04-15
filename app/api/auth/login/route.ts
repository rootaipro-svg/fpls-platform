import { NextRequest, NextResponse } from "next/server";
import { login, sessionCookieName } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const token = await login(email, password);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 12
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 401 });
  }
}
