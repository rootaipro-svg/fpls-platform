import { UserRoundSearch, UserPlus, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import InspectorManagerForm from "@/components/inspector-manager-form";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function InspectorsPage() {
  const actor = await requirePermission("settings", "view");

  const [inspectors, users, systemsRef] = await Promise.all([
    readSheet(actor.workbookId, "INSPECTORS"),
    readSheet(actor.workbookId, "USERS"),
    readSheet(actor.workbookId, "SYSTEMS_REF"),
  ]);

  const normalizedInspectors = (inspectors || []).map((row: any) => ({
    ...row,
    inspector_id: String(row.inspector_id || ""),
    inspector_code: String(row.inspector_code || ""),
    full_name: String(row.full_name || ""),
    full_name_ar: String(row.full_name_ar || ""),
    employer_name: String(row.employer_name || ""),
    phone: String(row.phone || ""),
    email: String(row.email || ""),
    national_id_or_iqama: String(row.national_id_or_iqama || ""),
    region_base: String(row.region_base || ""),
    status: String(row.status || "active").toLowerCase(),
    notes: String(row.notes || ""),
    app_user_id: String(row.app_user_id || ""),
    allowed_systems: String(row.allowed_systems || ""),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  }));

  const activeCount = normalizedInspectors.filter(
    (x: any) => x.status === "active"
  ).length;

  const inactiveCount = normalizedInspectors.length - activeCount;

  const linkedUsersCount = normalizedInspectors.filter(
    (x: any) => String(x.app_user_id || "").trim() !== ""
  ).length;

  const userOptions = (users || []).map((u: any) => ({
    app_user_id: String(u.app_user_id || ""),
    full_name: String(u.full_name || u.name || ""),
    email: String(u.email || ""),
    role: String(u.role || "inspector").toLowerCase(),
    account_status: String(u.account_status || "active").toLowerCase(),
  }));

  const inspectorUserOptions = userOptions.filter(
    (u: any) =>
      u.role === "inspector" &&
      u.account_status === "active" &&
      String(u.app_user_id || "").trim() !== ""
  );

  const systemOptions = (systemsRef || [])
    .filter((s: any) => String(s.enabled || "").toLowerCase() !== "false")
    .map((s: any) => ({
      system_code: String(s.system_code || ""),
      system_name: String(s.system_name || s.system_code || ""),
    }));

  return (
    <AppShell>
      <PageHeader
        title="إدارة المفتشين"
        subtitle="إضافة المفتشين وربطهم بحسابات النظام وتحديد الأنظمة المسموحة لهم"
      />

      <div className="stats-grid">
        <StatCard
          label="إجمالي المفتشين"
          value={normalizedInspectors.length}
          hint="جميع السجلات"
          icon={UserRoundSearch}
          tone="teal"
        />
        <StatCard
          label="النشطون"
          value={activeCount}
          hint="يظهرون في الزيارات"
          icon={UserPlus}
          tone="slate"
        />
        <StatCard
          label="غير النشطين"
          value={inactiveCount}
          hint="مخفون من التعيين"
          icon={UserRoundSearch}
          tone={inactiveCount > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="مرتبط بحساب"
          value={linkedUsersCount}
          hint="app_user_id موجود"
          icon={Wrench}
          tone="slate"
        />
      </div>

      <InspectorManagerForm
        inspectors={normalizedInspectors}
        users={inspectorUserOptions}
        systems={systemOptions}
      />

      {normalizedInspectors.length === 0 ? (
        <EmptyState
          title="لا يوجد مفتشون"
          description="أضف أول مفتش من النموذج أعلاه."
          icon={UserRoundSearch}
        />
      ) : null}
    </AppShell>
  );
}
