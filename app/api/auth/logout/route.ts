import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set(sessionCookieName, "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });

  return res;
}
