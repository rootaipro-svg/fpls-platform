import { ClipboardList } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHero, SectionCard } from "@/components/admin-page-kit";
import NewVisitForm from "@/components/new-visit-form";

import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function NewVisitPage({
  searchParams,
}: {
  searchParams?: Promise<{
    building_system_id?: string;
  }>;
}) {
  const actor = await requirePermission("visits", "create");
  const workbookId = actor.workbookId;

  const params = searchParams ? await searchParams : {};
  const initialBuildingSystemId = String(params?.building_system_id || "");

  const [facilities, buildings, buildingSystems, systemsRef, inspectors] =
    await Promise.all([
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
      readSheet(workbookId, "BUILDING_SYSTEMS").catch(() => []),
      readSheet(workbookId, "SYSTEMS_REF").catch(() => []),
      readSheet(workbookId, "INSPECTORS").catch(() => []),
    ]);

  return (
    <AppShell>
      <PageHero
        eyebrow={
          initialBuildingSystemId
            ? "إنشاء زيارة من صفحة نظام محدد"
            : "إنشاء زيارة فحص جديدة"
        }
        title={
          initialBuildingSystemId
            ? "بدء فحص لهذا النظام"
            : "زيارة جديدة"
        }
        subtitle={
          initialBuildingSystemId
            ? "النظام والمنشأة والمبنى سيتم تحديدها تلقائيًا"
            : "اختر المنشأة والمبنى والأنظمة المشمولة بالفحص"
        }
        icon={ClipboardList}
        pills={[initialBuildingSystemId ? "من QR / نظام" : "زيارة جديدة"]}
      />

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title={
            initialBuildingSystemId
              ? "تأكيد بيانات الفحص"
              : "بيانات الزيارة"
          }
          subtitle={
            initialBuildingSystemId
              ? "راجع النظام المحدد ثم أنشئ الزيارة"
              : "حدد نطاق الزيارة والأنظمة المطلوب فحصها"
          }
        >
          <NewVisitForm
            facilities={facilities}
            buildings={buildings}
            buildingSystems={buildingSystems}
            systemsRef={systemsRef}
            inspectors={inspectors}
            initialBuildingSystemId={initialBuildingSystemId}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
