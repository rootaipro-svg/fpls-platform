import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "./env";
import { readSheet } from "./sheets";
import { SessionUser } from "./types";

const COOKIE_NAME = "fpls_session";

export async function login(email: string, password: string): Promise<string> {
  const users = await readSheet(env.controlSheetId, "TENANT_USERS");
  const match = users.find(
    (u) => String(u.email).toLowerCase() === email.toLowerCase() && String(u.password_hash) === password && String(u.active_status) === "active"
  );

  if (!match) throw new Error("Invalid credentials");

  const payload: SessionUser = {
    appUserId: String(match.app_user_id),
    tenantId: String(match.tenant_id),
    roleCode: String(match.role_code),
    inspectorId: String(match.linked_inspector_id || "") || null,
    email: String(match.email),
    fullName: String(match.full_name)
  };

  return jwt.sign(payload, env.jwtSecret, { expiresIn: "12h" });
}

export async function getSessionUser(): Promise<SessionUser> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return jwt.verify(token, env.jwtSecret) as SessionUser;
}

export const sessionCookieName = COOKIE_NAME;
