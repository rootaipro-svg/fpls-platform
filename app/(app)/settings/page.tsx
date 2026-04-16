import Link from "next/link";
import { Settings, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CardLinkHint } from "@/components/card-link-hint";
import TenantProfileForm from "@/components/tenant-profile-form";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function SettingsPage() {
  const actor = await requirePermission("settings", "view");
  const rows = await readSheet(actor.workbookId, "TENANT_PROFILE");
  const profile =
    rows.find((r) => String(r.tenant_id) === String(actor.tenantId)) || {};

  return (
    <AppShell>
      <PageHeader
        title="إعدادات العميل"
        subtitle="تخصيص هوية الجهة والشعار وبيانات التقرير"
      />

      <Link href="/settings/users" className="quick-link-card">
        <div className="quick-link-title">إدارة المستخدمين والصلاحيات</div>
        <div className="quick-link-text">
          تحكم في دور كل مستخدم وحالة الحساب داخل هذا العميل.
        </div>
        <CardLinkHint label="فتح إدارة المستخدمين" />
      </Link>
<a href="/inspectors" className="settings-link-card">
  فتح إدارة المفتشين
</a>
      {!rows ? (
        <EmptyState
          title="تعذر تحميل الإعدادات"
          description="تأكد من وجود شيت TENANT_PROFILE داخل ملف العميل."
          icon={Settings}
        />
      ) : (
        <TenantProfileForm initialProfile={profile} />
      )}
    </AppShell>
  );
}
