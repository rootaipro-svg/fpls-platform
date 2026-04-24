import { ClipboardList } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHero, SectionCard } from "@/components/admin-page-kit";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import NewVisitForm from "@/components/new-visit-form";

export default async function NewVisitPage() {
  const actor = await requirePermission("visits", "create");
  const workbookId = actor.workbookId;

  const [facilities, buildings, buildingSystems, inspectors] =
    await Promise.all([
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
      readSheet(workbookId, "BUILDING_SYSTEMS").catch(() => []),
      readSheet(workbookId, "INSPECTORS").catch(() => []),
    ]);

  return (
    <AppShell>
      <PageHero
        eyebrow="إنشاء زيارة فحص جديدة"
        title="زيارة جديدة"
        subtitle="حدد المنشأة والمبنى والأنظمة والمفتش المسؤول"
        icon={ClipboardList}
      />

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="بيانات الزيارة"
          subtitle="بعد الحفظ سيتم إنشاء الزيارة وربط الأنظمة بها تلقائيًا"
        >
          <NewVisitForm
            facilities={facilities}
            buildings={buildings}
            buildingSystems={buildingSystems}
            inspectors={inspectors}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
