import { env } from "./env";
import { readSheet } from "./sheets";

export async function getTenantRecord(tenantId: string) {
  const tenants = await readSheet(env.controlSheetId, "TENANTS");
  const tenant = tenants.find((t) => String(t.tenant_id) === tenantId && String(t.status) === "active");
  if (!tenant) throw new Error("Tenant not found or inactive");
  return tenant;
}

export async function getTenantWorkbookId(tenantId: string) {
  const tenant = await getTenantRecord(tenantId);
  return String(tenant.sheet_id);
}
