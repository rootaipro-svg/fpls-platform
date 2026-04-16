import { readSheet } from "@/lib/sheets";

type ActorLike = {
  appUserId?: string;
  email?: string;
};

export async function getCurrentInspector(
  workbookId: string,
  actor: ActorLike
) {
  const inspectors = await readSheet(workbookId, "INSPECTORS");

  const byAppUserId = inspectors.find(
    (row: any) =>
      String(row.app_user_id || "").trim() ===
      String(actor.appUserId || "").trim()
  );

  if (byAppUserId) {
    return byAppUserId;
  }

  const byEmail = inspectors.find(
    (row: any) =>
      String(row.email || "").trim().toLowerCase() ===
      String(actor.email || "").trim().toLowerCase()
  );

  return byEmail || null;
}

export function isVisitAssignedToInspector(visit: any, inspectorId: string) {
  return (
    String(visit?.assigned_inspector_id || "").trim() ===
    String(inspectorId || "").trim()
  );
}
