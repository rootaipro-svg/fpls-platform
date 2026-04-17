import Link from "next/link";
import { ClipboardList, QrCode, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import EditAssetForm from "@/components/edit-asset-form";
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

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("facilities", "view");
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
        <PageHeader title="تفاصيل الأصل" subtitle={`رقم الأصل: ${String(id)}`} />
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
          <PageHeader
            title="تفاصيل الأصل"
            subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
          />
          <EmptyState
            title="تعذر فتح الأصل"
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
          <PageHeader title="تفاصيل الأصل" subtitle="غير مصرح" />
          <EmptyState
            title="هذا الأصل غير مخول لك"
            description="يمكنك فقط الوصول إلى الأصول التابعة للأنظمة المصرح لك بها."
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

  const activeVisit =
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
        title={String(asset.asset_name_ar || asset.asset_name || "تفاصيل الأصل")}
        subtitle={`الأصل: ${String(asset.asset_code || asset.asset_id || "-")}`}
      />

      <section className="card">
        <div className="section-title">بيانات الأصل</div>

        <div className="stack-3" style={{ marginTop: "14px" }}>
          <div>
            <div className="text-sm text-slate-500">الاسم</div>
            <div className="mt-1 font-medium">
              {String(asset.asset_name_ar || asset.asset_name || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">النظام</div>
            <div className="mt-1 font-medium">
              {String(asset.system_code || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">المنشأة / المبنى</div>
            <div className="mt-1 font-medium">
              {String(facility?.facility_name || "-")}
              {building ? ` · ${String(building.building_name || "")}` : ""}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">نوع الأصل</div>
            <div className="mt-1 font-medium">
              {String(asset.asset_type || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">الموقع</div>
            <div className="mt-1 font-medium">
              {String(asset.location_note || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">الحالة</div>
            <div className="mt-1 font-medium">
              {String(asset.status || "active")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">قيمة QR</div>
            <div className="mt-1 font-medium" style={{ wordBreak: "break-all" }}>
              {String(asset.qr_code_value || "-")}
            </div>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: "16px" }}>
          <Link href={`/assets/${id}/inspect`} className="btn">
            <ClipboardList size={18} />
            بدء فحص الأصل
          </Link>

          <Link href={`/assets/${id}/qr`} className="btn btn-secondary">
            <QrCode size={18} />
            عرض QR
          </Link>

          <Link
            href={`/facilities/${String(asset.facility_id || "")}`}
            className="btn btn-secondary"
          >
            العودة للمنشأة
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="section-title">حالة الفحص لهذا الأصل</div>
        <div className="section-subtitle">
          يعتمد تنفيذ الفحص على وجود زيارة غير مغلقة مرتبطة بنفس النظام/المبنى.
        </div>

        <div className="stack-3" style={{ marginTop: "14px" }}>
          <div>
            <div className="text-sm text-slate-500">الزيارة النشطة</div>
            <div className="mt-1 font-medium">
              {activeVisit
                ? `${String(activeVisit.visit_id)} · ${String(
                    activeVisit.visit_status || "-"
                  )}`
                : "لا توجد زيارة نشطة لهذا الأصل حاليًا"}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">إجمالي الزيارات المرتبطة</div>
            <div className="mt-1 font-medium">{relatedVisits.length}</div>
          </div>
        </div>

        <div className="btn-row" style={{ marginTop: "16px" }}>
          {activeVisit ? (
            <Link
              href={`/visits/${String(activeVisit.visit_id)}`}
              className="btn btn-secondary"
            >
              فتح زيارة التنفيذ
            </Link>
          ) : (
            <Link
              href={`/facilities/${String(asset.facility_id || "")}`}
              className="btn btn-secondary"
            >
              الرجوع للمنشأة وإنشاء زيارة
            </Link>
          )}
        </div>
      </section>

      <section className="card">
        <div className="section-title">قائمة الفحص المرتبطة بالأصل</div>
        <div className="section-subtitle">
          هذه القائمة مأخوذة من النظام المرتبط بهذا الأصل.
        </div>

        {checklistItems.length === 0 ? (
          <div className="muted-note" style={{ marginTop: "14px" }}>
            لا توجد Checklist مرتبطة بهذا النظام.
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "14px" }}>
            {checklistItems.slice(0, 10).map((item: any) => (
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

      <EditAssetForm
        asset={{
          asset_id: String(asset.asset_id || ""),
          asset_code: String(asset.asset_code || ""),
          asset_name: String(asset.asset_name || ""),
          asset_name_ar: String(asset.asset_name_ar || ""),
          asset_type: String(asset.asset_type || ""),
          location_note: String(asset.location_note || ""),
          status: String(asset.status || "active"),
        }}
      />
    </AppShell>
  );
}
