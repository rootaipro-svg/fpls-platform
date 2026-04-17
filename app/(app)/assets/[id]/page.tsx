import Link from "next/link";
import { ClipboardList, QrCode, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import EditAssetForm from "@/components/edit-asset-form";
import { SeverityBadge } from "@/components/severity-badge";
import { FindingStatusBadge } from "@/components/finding-status-badge";
import { requirePermission } from "@/lib/permissions";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";
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
    const aTime = new Date(
      String(a?.planned_date || a?.visit_date || a?.updated_at || 0)
    ).getTime();
    const bTime = new Date(
      String(b?.planned_date || b?.visit_date || b?.updated_at || 0)
    ).getTime();
    return bTime - aTime;
  });
}

function sortByStampDesc(rows: any[], ...fields: string[]) {
  return [...rows].sort((a, b) => {
    const aValue =
      fields.map((f) => String(a?.[f] || "")).find(Boolean) || "0";
    const bValue =
      fields.map((f) => String(b?.[f] || "")).find(Boolean) || "0";

    const aTime = new Date(aValue).getTime();
    const bTime = new Date(bValue).getTime();

    return bTime - aTime;
  });
}

function toArabicResponse(value: string) {
  const v = String(value || "").toLowerCase();
  if (v === "compliant") return "مطابق";
  if (v === "non_compliant") return "غير مطابق";
  if (v === "not_applicable") return "غير منطبق";
  return value || "-";
}

function looksLikeImage(url: string, evidenceType: string) {
  const u = String(url || "").toLowerCase();
  if (String(evidenceType || "").toLowerCase() === "image") return true;

  return (
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".png") ||
    u.endsWith(".webp") ||
    u.includes("blob.vercel-storage.com")
  );
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("facilities", "view");
  const workbookId = actor.workbookId;

  const [
    assets,
    facilities,
    buildings,
    visits,
    visitSystems,
    responses,
    findings,
    evidence,
  ] = await Promise.all([
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "RESPONSES"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "EVIDENCE"),
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

  const checklistLookup = new Map<
    string,
    { question_text: string; section_name: string; acceptance_criteria: string }
  >();

  for (const item of checklistItems) {
    checklistLookup.set(String(item.checklist_item_id || ""), {
      question_text: String(item.question_text || "-"),
      section_name: String(item.section_name || "Section"),
      acceptance_criteria: String(item.acceptance_criteria || "-"),
    });
  }

  const assetResponses = sortByStampDesc(
    responses.filter((row) => String(row.asset_id || "") === String(id)),
    "response_at",
    "updated_at"
  );

  const assetFindings = sortByStampDesc(
    findings.filter((row) => String(row.asset_id || "") === String(id)),
    "updated_at",
    "created_at"
  );

  const assetEvidence = sortByStampDesc(
    evidence.filter((row) => String(row.asset_id || "") === String(id)),
    "taken_at",
    "updated_at",
    "created_at"
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
              href={`/visits/${String(activeVisit.visit_id)}?asset_id=${encodeURIComponent(
                String(id)
              )}`}
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

      <section className="card">
        <div className="section-title">آخر نتائج الفحص لهذا الأصل</div>
        <div className="section-subtitle">
          السجل الفعلي للبنود التي تم تقييمها على هذا الأصل
        </div>

        {assetResponses.length === 0 ? (
          <div className="muted-note" style={{ marginTop: "14px" }}>
            لا توجد نتائج فحص مرتبطة بهذا الأصل بعد.
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "14px" }}>
            {assetResponses.slice(0, 10).map((row: any) => {
              const visitSystem = assetVisitSystems.find(
                (vs) =>
                  String(vs.visit_system_id) === String(row.visit_system_id || "")
              );

              const visit = relatedVisits.find(
                (v) => String(v.visit_id) === String(visitSystem?.visit_id || "")
              );

              const checklistMeta = checklistLookup.get(
                String(row.checklist_item_id || "")
              );

              return (
                <div key={String(row.response_id || "")} className="system-line">
                  <div className="system-line-top">
                    <div>
                      <div className="system-line-title">
                        {String(checklistMeta?.question_text || row.checklist_item_id || "-")}
                      </div>
                      <div className="system-line-date">
                        {String(checklistMeta?.section_name || "Section")}
                        {visit ? ` · زيارة ${String(visit.visit_id)}` : ""}
                        {row.response_at ? ` · ${String(row.response_at)}` : ""}
                      </div>
                    </div>

                    <div className="badge-wrap">
                      <span className="badge">
                        {toArabicResponse(String(row.response_value || ""))}
                      </span>
                      {row.finding_severity ? (
                        <span className="badge">
                          {String(row.finding_severity)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {row.comments ? (
                    <div className="visit-card-text" style={{ marginTop: "10px" }}>
                      {String(row.comments)}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title">آخر المخالفات الخاصة بهذا الأصل</div>
        <div className="section-subtitle">
          المخالفات الناتجة عن فحص هذا الأصل تحديدًا
        </div>

        {assetFindings.length === 0 ? (
          <div className="muted-note" style={{ marginTop: "14px" }}>
            لا توجد مخالفات مرتبطة بهذا الأصل بعد.
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "14px" }}>
            {assetFindings.slice(0, 10).map((finding: any) => (
              <div key={String(finding.finding_id || "")} className="card">
                <div className="section-header-row">
                  <div className="section-header-side">
                    <FindingStatusBadge
                      status={String(
                        finding.closure_status ||
                          finding.compliance_status ||
                          "open"
                      )}
                    />
                    <SeverityBadge severity={String(finding.severity || "")} />
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: "12px" }}>
                  {String(finding.title || "مخالفة")}
                </div>

                <div className="section-subtitle" style={{ marginTop: "8px" }}>
                  {String(finding.description || "لا يوجد وصف")}
                </div>

                <div className="badge-wrap" style={{ marginTop: "12px" }}>
                  <span className="badge">
                    الكود: {String(finding.finding_code || "-")}
                  </span>
                  <span className="badge">
                    الإجراء: {String(finding.corrective_action || "غير مسجل")}
                  </span>
                </div>

                <div style={{ marginTop: "14px" }}>
                  <Link
                    href={`/findings/${String(finding.finding_id)}`}
                    className="btn btn-secondary"
                  >
                    فتح المخالفة
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title">آخر الأدلة الخاصة بهذا الأصل</div>
        <div className="section-subtitle">
          الصور والمرفقات المرتبطة بفحص هذا الأصل
        </div>

        {assetEvidence.length === 0 ? (
          <div className="muted-note" style={{ marginTop: "14px" }}>
            لا توجد أدلة مرتبطة بهذا الأصل بعد.
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "14px" }}>
            {assetEvidence.slice(0, 10).map((row: any) => (
              <div key={String(row.evidence_id || "")} className="card">
                <div className="badge-wrap">
                  <span className="badge">
                    {String(row.evidence_type || "evidence")}
                  </span>
                  {row.file_name ? (
                    <span className="badge">{String(row.file_name)}</span>
                  ) : null}
                </div>

                {looksLikeImage(
                  String(row.file_url || ""),
                  String(row.evidence_type || "")
                ) ? (
                  <div style={{ marginTop: "12px" }}>
                    <img
                      src={String(row.file_url || "")}
                      alt={String(row.file_name || "Evidence")}
                      style={{
                        width: "100%",
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </div>
                ) : null}

                {row.caption ? (
                  <div className="visit-card-text" style={{ marginTop: "10px" }}>
                    {String(row.caption)}
                  </div>
                ) : null}

                <div className="section-subtitle" style={{ marginTop: "10px" }}>
                  {String(row.taken_at || "")}
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
