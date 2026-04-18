import Link from "next/link";
import CreateAssetVisitButton from "@/components/create-asset-visit-button";
import { ClipboardList, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { getCurrentInspector, isVisitAssignedToInspector } from "@/lib/current-inspector";
import { readSheet } from "@/lib/sheets";
import { getChecklistForSystem } from "@/lib/checklist";

function parseAllowedSystems(value: any) {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sortVisitsDesc(rows: any[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.planned_date || a?.visit_date || 0)).getTime();
    const bTime = new Date(String(b?.planned_date || b?.visit_date || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function AssetInspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("visits", "view");
  const workbookId = actor.workbookId;

  const [assets, facilities, buildings, visits, visitSystems] = await Promise.all([
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
  ]);

  const asset = assets.find((row) => String(row.asset_id) === String(id));

  if (!asset) {
    return (
      <AppShell>
        <PageHeader title="فحص الأصل" subtitle={`الأصل: ${String(id)}`} />
        <EmptyState
          title="الأصل غير موجود"
          description="تعذر العثور على الأصل المطلوب."
        />
      </AppShell>
    );
  }

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(workbookId, actor)
      : null;

  if (actor.role === "inspector") {
    if (!currentInspector) {
      return (
        <AppShell>
          <PageHeader title="فحص الأصل" subtitle="لا يوجد ملف مفتش" />
          <EmptyState
            title="تعذر تنفيذ الفحص"
            description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
            icon={UserRound}
          />
        </AppShell>
      );
    }

    const allowedSystems = parseAllowedSystems(currentInspector.allowed_systems);
    const canAccess =
      allowedSystems.includes("*") ||
      allowedSystems.includes(String(asset.system_code || ""));

    if (!canAccess) {
      return (
        <AppShell>
          <PageHeader title="فحص الأصل" subtitle="غير مصرح" />
          <EmptyState
            title="هذا الأصل غير مخول لك"
            description="يمكنك فقط تنفيذ فحص الأصول التابعة للأنظمة المصرح لك بها."
            icon={UserRound}
          />
        </AppShell>
      );
    }
  }

  const facility = facilities.find(
    (row) => String(row.facility_id) === String(asset.facility_id || "")
  );

  const building = buildings.find(
    (row) => String(row.building_id) === String(asset.building_id || "")
  );

  const assetVisitSystems = visitSystems.filter(
    (row) =>
      String(row.building_system_id) === String(asset.building_system_id || "")
  );

  const assetVisitIds = new Set(
    assetVisitSystems.map((row) => String(row.visit_id))
  );

  const relatedVisits = sortVisitsDesc(
    visits.filter((row) => assetVisitIds.has(String(row.visit_id)))
  );

  const executionVisit =
    actor.role === "inspector" && currentInspector
      ? relatedVisits.find(
          (row) =>
            String(row.visit_status || "").toLowerCase() !== "closed" &&
            isVisitAssignedToInspector(row, String(currentInspector.inspector_id))
        )
      : relatedVisits.find(
          (row) => String(row.visit_status || "").toLowerCase() !== "closed"
        );

  const checklistItems = await getChecklistForSystem(
    workbookId,
    String(asset.system_code || "")
  );

  return (
    <AppShell>
      <PageHeader
        title="فحص الأصل"
        subtitle={String(asset.asset_name_ar || asset.asset_name || "أصل")}
      />

      <section className="card">
        <div className="section-title">ملخص الأصل</div>
        <div className="section-subtitle">
          {String(facility?.facility_name || "-")}
          {building ? ` · ${String(building.building_name || "")}` : ""}
          {asset.system_code ? ` · ${String(asset.system_code)}` : ""}
        </div>

        <div className="btn-row" style={{ marginTop: "16px" }}>
          {executionVisit ? (
            <Link
              href={`/visits/${String(executionVisit.visit_id)}?asset_id=${encodeURIComponent(
                String(id)
              )}`}
              className="btn"
            >
              <ClipboardList size={18} />
              فتح زيارة التنفيذ
            </Link>
          ) : (
            <CreateAssetVisitButton
  assetId={String(id)}
  className="btn btn-secondary"
  label="لا توجد زيارة نشطة، أنشئ زيارة الآن"
/>
          )}

          <Link href={`/assets/${String(id)}`} className="btn btn-secondary">
            العودة للأصل
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="section-title">Checklist الأصل</div>
        <div className="section-subtitle">
          المعروضة هنا هي نفس Checklist النظام المرتبط بالأصل.
        </div>

        {checklistItems.length === 0 ? (
          <div className="muted-note" style={{ marginTop: "14px" }}>
            لا توجد قائمة فحص مرتبطة بهذا النظام.
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "14px" }}>
            {checklistItems.map((item: any) => (
              <div
                key={String(item.checklist_item_id || "")}
                className="checklist-item"
              >
                <div className="checklist-item-section">
                  {String(item.section_name || "Section")}
                </div>
                <div className="checklist-item-title">
                  {String(item.question_text || "-")}
                </div>
                <div className="checklist-item-criteria">
                  {String(item.acceptance_criteria || "-")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {!executionVisit ? (
        <section className="card">
          <div className="section-title">تنبيه تنفيذي</div>
          <div className="report-note-box" style={{ marginTop: "14px" }}>
            لا يمكن تنفيذ الفحص مباشرة لهذا الأصل إلا بوجود زيارة غير مغلقة مرتبطة
            بنفس النظام/المبنى. للمفتش: يجب أن تكون الزيارة أيضًا مسندة لك.
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
