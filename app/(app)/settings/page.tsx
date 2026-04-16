import { Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import TenantProfileForm from "@/components/tenant-profile-form";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function SettingsPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const rows = await readSheet(workbookId, "TENANT_PROFILE");
  const profile =
    rows.find((r) => String(r.tenant_id) === String(user.tenantId)) || {};

  return (
    <AppShell>
      <PageHeader
        title="إعدادات العميل"
        subtitle="تخصيص هوية الجهة والشعار وبيانات التقرير"
      />

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
