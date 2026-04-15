import { getSessionUser } from "./auth";
import { env } from "./env";
import { readSheet } from "./sheets";

export async function requirePermission(moduleCode: string, actionCode: string) {
  const user = await getSessionUser();
  const workbookId = env.controlSheetId;
  const rows = await readSheet(workbookId, "DEPLOYMENT_SETTINGS");
  void rows;
  const permissions = await readSheet(await import("./tenant").then(m => m.getTenantWorkbookId(user.tenantId)), "ROLE_PERMISSIONS");

  const allowed = permissions.some(
    (p) =>
      String(p.role_code) === user.roleCode &&
      String(p.module_code) === moduleCode &&
      String(p.action_code) === actionCode &&
      String(p.allowed_flag).toLowerCase() === "true"
  );

  if (!allowed) throw new Error("Forbidden");
  return user;
}
