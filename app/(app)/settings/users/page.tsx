import { ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import UserRoleManagerCard from "@/components/user-role-manager-card";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

type ManagedUserRow = {
  app_user_id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  role: string;
  account_status: string;
  [key: string]: any;
};

export default async function SettingsUsersPage() {
  const actor = await requirePermission("users", "view");
  const users = await readSheet(actor.workbookId, "USERS");

  const normalizedUsers: ManagedUserRow[] = (users || [])
    .filter((u: any) => {
      return String(u.app_user_id || u.email || u.full_name || "").trim() !== "";
    })
    .map((u: any) => ({
      ...u,
      app_user_id: String(u.app_user_id || ""),
      tenant_id: String(u.tenant_id || actor.tenantId || ""),
      full_name: String(u.full_name || u.name || "مستخدم"),
      email: String(u.email || ""),
      role: String(u.role || u.user_role || "inspector").toLowerCase(),
      account_status: String(
        u.account_status || u.status || "active"
      ).toLowerCase(),
    }));

  const adminCount = normalizedUsers.filter((u) => u.role === "admin").length;
  const reviewerCount = normalizedUsers.filter((u) => u.role === "reviewer").length;
  const inspectorCount = normalizedUsers.filter((u) => u.role === "inspector").length;
  const disabledCount = normalizedUsers.filter(
    (u) => u.account_status === "disabled"
  ).length;

  return (
    <AppShell>
      <PageHeader
        title="إدارة المستخدمين"
        subtitle="تحديد الدور وحالة الحساب لكل مستخدم داخل العميل"
      />

      <div className="stats-grid">
        <StatCard
          label="Admins"
          value={adminCount}
          hint="إدارة كاملة"
          icon={Users}
          tone="teal"
        />
        <StatCard
          label="Reviewers"
          value={reviewerCount}
          hint="مراجعة وتشغيل"
          icon={Users}
          tone="slate"
        />
        <StatCard
          label="Inspectors"
          value={inspectorCount}
          hint="تنفيذ ميداني"
          icon={Users}
          tone="slate"
        />
        <StatCard
          label="معطل"
          value={disabledCount}
          hint="حسابات غير نشطة"
          icon={ShieldCheck}
          tone={disabledCount > 0 ? "amber" : "slate"}
        />
      </div>

      <div className="permission-note-box">
        <strong>مصفوفة الصلاحيات الحالية:</strong>
        <br />
        admin: جميع الصلاحيات.
        <br />
        reviewer: إدارة الزيارات والمراجعة وإغلاق المخالفات، بدون إعدادات العميل.
        <br />
        inspector: تنفيذ الزيارات وتسجيل النتائج وعرض البيانات فقط.
      </div>

      {normalizedUsers.length === 0 ? (
        <EmptyState
          title="لا يوجد مستخدمون"
          description="أضف مستخدمين داخل شيت USERS ثم عد هنا لتوزيع الصلاحيات."
          icon={Users}
        />
      ) : (
        <div className="user-admin-grid">
          {normalizedUsers.map((userRow) => (
            <UserRoleManagerCard
              key={String(userRow.app_user_id || userRow.email)}
              userRow={userRow}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
