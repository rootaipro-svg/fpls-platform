import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

type Role = "admin" | "reviewer" | "inspector";
type Action = "view" | "create" | "update";

type Resource =
  | "dashboard"
  | "facilities"
  | "buildings"
  | "systems"
  | "visits"
  | "responses"
  | "findings"
  | "reports"
  | "settings"
  | "users";

const ACCESS_MATRIX: Record<Resource, Record<Action, Role[]>> = {
  dashboard: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin"],
    update: ["admin"],
  },
  facilities: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer"],
    update: ["admin", "reviewer"],
  },
  buildings: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer"],
    update: ["admin", "reviewer"],
  },
  systems: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer"],
    update: ["admin", "reviewer"],
  },
  visits: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer"],
    update: ["admin", "reviewer"],
  },
  responses: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer", "inspector"],
    update: ["admin", "reviewer", "inspector"],
  },
  findings: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer"],
    update: ["admin", "reviewer"],
  },
  reports: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer"],
    update: ["admin", "reviewer"],
  },
  settings: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
  },
  users: {
    view: ["admin"],
    create: ["admin"],
    update: ["admin"],
  },
};

function normalizeRole(value: any): Role {
  const role = String(value || "").toLowerCase();

  if (role === "admin") return "admin";
  if (role === "reviewer") return "reviewer";
  return "inspector";
}

function normalizeAccountStatus(value: any): string {
  const status = String(value || "").toLowerCase();

  if (status === "disabled" || status === "inactive" || status === "blocked") {
    return "disabled";
  }

  return "active";
}

export async function getActorContext() {
  const sessionUser = await getSessionUser();
  const workbookId = await getTenantWorkbookId(sessionUser.tenantId);
  const users = await readSheet(workbookId, "USERS");

  const userRow =
    users.find(
      (u) =>
        String(u.app_user_id || "") === String(sessionUser.appUserId || "")
    ) ||
    users.find((u) => String(u.email || "") === String(sessionUser.email || ""));

  const role = normalizeRole(userRow?.role || userRow?.user_role);
  const accountStatus = normalizeAccountStatus(
    userRow?.account_status || userRow?.status
  );

  if (accountStatus !== "active") {
    throw new Error("Your account is disabled");
  }

  return {
    ...sessionUser,
    role,
    accountStatus,
    userRow,
    workbookId,
  };
}

export async function requirePermission(
  resource: Resource,
  action: Action = "view"
) {
  const actor = await getActorContext();
  const allowedRoles = ACCESS_MATRIX[resource]?.[action] || ["admin"];

  if (!allowedRoles.includes(actor.role)) {
    throw new Error("Unauthorized");
  }

  return actor;
}
