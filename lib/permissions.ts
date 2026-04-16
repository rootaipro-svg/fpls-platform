import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

type Role = "admin" | "reviewer" | "inspector";

type CurrentResource =
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

type LegacyResource = "platform" | "evidence";

export type Resource = CurrentResource | LegacyResource;

type CurrentAction = "view" | "create" | "update";
type LegacyAction = "edit" | "tenant_create";

export type Action = CurrentAction | LegacyAction;

const ACCESS_MATRIX: Record<
  Exclude<Resource, "platform">,
  Record<CurrentAction, Role[]>
> = {
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
  evidence: {
    view: ["admin", "reviewer", "inspector"],
    create: ["admin", "reviewer", "inspector"],
    update: ["admin", "reviewer", "inspector"],
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

function normalizeResource(resource: Resource): Resource {
  return resource;
}

function normalizeAction(action?: Action): CurrentAction | "tenant_create" {
  if (!action) return "view";
  if (action === "edit") return "update";
  if (action === "tenant_create") return "tenant_create";
  return action;
}

async function getTenantActorContext() {
  const sessionUser = await getSessionUser();

  if (!sessionUser?.tenantId) {
    throw new Error("No tenant assigned to current user");
  }

  const workbookId = await getTenantWorkbookId(sessionUser.tenantId);

  let users: any[] = [];
  try {
    users = await readSheet(workbookId, "USERS");
  } catch {
    users = [];
  }

  const userRow =
    users.find(
      (u) =>
        String(u.app_user_id || "") === String(sessionUser.appUserId || "")
    ) ||
    users.find(
      (u) => String(u.email || "").toLowerCase() === String(sessionUser.email || "").toLowerCase()
    ) ||
    null;

  const role = userRow
    ? normalizeRole(userRow.role || userRow.user_role)
    : "admin";

  const accountStatus = userRow
    ? normalizeAccountStatus(userRow.account_status || userRow.status)
    : "active";

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

export async function getActorContext() {
  return getTenantActorContext();
}

export async function requirePermission(
  resource: Resource,
  action: Action = "view"
) {
  const normalizedResource = normalizeResource(resource);
  const normalizedAction = normalizeAction(action);

  if (normalizedResource === "platform") {
    if (normalizedAction !== "tenant_create") {
      throw new Error("Unauthorized");
    }

    const sessionUser = await getSessionUser();
    return {
      ...sessionUser,
      role: "admin" as Role,
      accountStatus: "active",
      userRow: null,
      workbookId: "",
    };
  }

  const actor = await getTenantActorContext();

  const allowedRoles =
    ACCESS_MATRIX[normalizedResource][
      normalizedAction === "tenant_create" ? "create" : normalizedAction
    ] || ["admin"];

  if (!allowedRoles.includes(actor.role)) {
    throw new Error("Unauthorized");
  }

  return actor;
}
