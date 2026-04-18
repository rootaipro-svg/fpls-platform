import { ClipboardList, FileCheck2, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { ComplianceProgress } from "@/components/compliance-progress";
import { VisitSystemSummaryCard } from "@/components/visit-system-summary-card";
import VisitExecutionForm from "@/components/visit-execution-form";
import { requirePermission } from "@/lib/permissions";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";
import { readSheet } from "@/lib/sheets";
import { getChecklistForSystem } from "@/lib/checklist";
import type { AssetBaselineRow } from "@/lib/asset-baseline";

export default async function VisitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ asset_id?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const requestedAssetId = String(search?.asset_id || "");

  const actor = await requirePermission("visits", "view");
  const workbookId = actor.workbookId;

  const [
    visits,
    visitSystems,
    facilities,
    buildings,
    responses,
    findings,
    inspectors,
    evidence,
    assets,
    assetBaselinesRows,
  ] = await Promise.all([
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "RESPONSES"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "INSPECTORS"),
    readSheet(workbookId, "EVIDENCE"),
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "ASSET_BASELINES"),
  ]);

  const visit = visits.find((v: any) => String(v.visit_id) === id);
  const systems = visitSystems.filter((vs: any) => String(vs.visit_id) === id);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(workbookId, actor)
      : null;

  if (actor.role === "inspector") {
    if (!currentInspector) {
      return (
        <AppShell>
          <PageHeader
            title="تفاصيل الزيارة"
            subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
          />
          <EmptyState
            title="تعذر فتح الزيارة"
            description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
            icon={UserRound}
          />
        </AppShell>
      );
    }

    if (!isVisitAssignedToInspector(visit, String(currentInspector.inspector_id))) {
      return (
        <AppShell>
          <PageHeader title="تفاصيل الزيارة" subtitle="غير مصرح" />
          <EmptyState
            title="هذه الزيارة ليست مخصصة لك"
            description="يمكنك فقط الوصول إلى الزيارات المعيّنة لحسابك."
            icon={UserRound}
          />
        </AppShell>
      );
    }
  }

  const facility = facilities.find(
    (f: any) => String(f.facility_id) === String(visit?.facility_id || "")
  );

  const building = buildings.find(
    (b: any) => String(b.building_id) === String(visit?.building_id || "")
  );

  const assignedInspector = inspectors.find(
    (i: any) => String(i.inspector_id) === String(visit?.assigned_inspector_id || "")
  );

  const visitSystemIds = new Set(systems.map((s: any) => String(s.visit_system_id)));
  const visitBuildingSystemIds = new Set(
    systems.map((s: any) => String(s.building_system_id || ""))
  );

  const responseRows = responses.filter((r: any) =>
    visitSystemIds.has(String(r.visit_system_id))
  );

  const findingRows = findings.filter((f: any) =>
    visitSystemIds.has(String(f.visit_system_id))
  );

  const visitEvidence = evidence.filter(
    (row: any) => String(row.visit_id) === String(id)
  );

  let activeAsset: any = null;

  if (requestedAssetId) {
    const requestedAsset = assets.find(
      (row: any) =>
        String(row.asset_id) === requestedAssetId &&
        visitBuildingSystemIds.has(String(row.building_system_id || ""))
    );

    if (requestedAsset) {
      const matchedVisitSystem = systems.find(
        (row: any) =>
          String(row.building_system_id || "") ===
          String(requestedAsset.building_system_id || "")
      );

      if (matchedVisitSystem) {
        activeAsset = {
          asset_id: String(requestedAsset.asset_id || ""),
          asset_code: String(requestedAsset.asset_code || ""),
          asset_name: String(requestedAsset.asset_name || ""),
          asset_name_ar: String(requestedAsset.asset_name_ar || ""),
          system_code: String(requestedAsset.system_code || ""),
          location_note: String(requestedAsset.location_note || ""),
          visit_system_id: String(matchedVisitSystem.visit_system_id || ""),
        };
      }
    }
  }

  const activeAssetBaselines: AssetBaselineRow[] = activeAsset
    ? assetBaselinesRows
        .filter(
          (row: any) =>
            String(row.asset_id || "") === String(activeAsset.asset_id || "") &&
            String(row.is_active || "true").toLowerCase() !== "false"
        )
        .map((row: any) => ({
          baseline_id: String(row.baseline_id || ""),
          tenant_id: String(row.tenant_id || ""),
          asset_id: String(row.asset_id || ""),
          system_code: String(row.system_code || ""),
          baseline_profile_code: String(row.baseline_profile_code || ""),
          metric_code: String(row.metric_code || ""),
          metric_name_ar: String(row.metric_name_ar || ""),
          metric_unit: String(row.metric_unit || ""),
          ref_value: String(row.ref_value || ""),
          ref_value_2: String(row.ref_value_2 || ""),
          ref_value_3: String(row.ref_value_3 || ""),
          low_limit: String(row.low_limit || ""),
          high_limit: String(row.high_limit || ""),
          allowed_dev_abs: String(row.allowed_dev_abs || ""),
          allowed_dev_pct: String(row.allowed_dev_pct || ""),
          compare_mode: String(row.compare_mode || ""),
          baseline_date: String(row.baseline_date || ""),
          baseline_source: String(row.baseline_source || ""),
          is_active: String(row.is_active || "true").toLowerCase() !== "false",
          notes: String(row.notes || ""),
          created_at: String(row.created_at || ""),
          updated_at: String(row.updated_at || ""),
        }))
    : [];

  const compliantCount = responseRows.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "compliant"
  ).length;

  const nonCompliantCount = responseRows.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "non_compliant"
  ).length;

  const notApplicableCount = responseRows.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "not_applicable"
  ).length;

  const scoredTotal = compliantCount + nonCompliantCount;
  const overallCompliance =
    scoredTotal > 0 ? Math.round((compliantCount / scoredTotal) * 100) : 0;

  const openFindingsCount = findingRows.filter(
    (f: any) =>
      String(f.closure_status || f.compliance_status || "").toLowerCase() !==
      "closed"
  ).length;

  const executionItemsNested = await Promise.all(
    systems.map(async (system: any) => {
      const items = await getChecklistForSystem(
        workbookId,
        String(system.system_code)
      );

      return items.map((item: any) => ({
        visit_system_id: String(system.visit_system_id),
        building_system_id: String(system.building_system_id),
        system_code: String(system.system_code),
        checklist_item_id: String(item.checklist_item_id),
        item_code: String(item.item_code || item.checklist_item_id || ""),
        section_name: String(item.section_name || ""),
        question_text: String(item.question_text || ""),
        acceptance_criteria: String(item.acceptance_criteria || ""),
        response_type_v2: String(item.response_type_v2 || "pass_fail_na"),
        numeric_unit: String(item.numeric_unit || ""),
        target_min: String(item.target_min ?? ""),
        target_max: String(item.target_max ?? ""),
        calc_rule: String(item.calc_rule || ""),
        ui_hint_ar: String(item.ui_hint_ar || ""),
        severity_default: String(item.severity_default || "major"),
        evidence_required: Boolean(item.evidence_required),
        photo_required: Boolean(item.photo_required),
      }));
    })
  );

  const executionItems = executionItemsNested.flat();

  const existingResponses = responseRows
    .filter((r: any) => {
      if (!activeAsset?.asset_id) return true;
      const rowAssetId = String(r.asset_id || "");
      return !rowAssetId || rowAssetId === String(activeAsset.asset_id);
    })
    .map((r: any) => ({
      visit_system_id: String(r.visit_system_id),
      checklist_item_id: String(r.checklist_item_id),
      response_value: String(r.response_value || ""),
      finding_severity: String(r.finding_severity || ""),
      comments: String(r.comments || ""),
      numeric_value: String(r.numeric_value || ""),
      numeric_value_2: String(r.numeric_value_2 || ""),
      numeric_value_3: String(r.numeric_value_3 || ""),
      numeric_unit: String(r.numeric_unit || ""),
      calc_rule: String(r.calc_rule || ""),
      calc_result_text: String(r.calc_result_text || ""),
      auto_judgement: String(r.auto_judgement || ""),
    }));

  const reportReady =
    String(visit?.visit_status || "").toLowerCase() === "closed" &&
    responseRows.length > 0;

  return (
    <AppShell>
      <PageHeader
        title="تفاصيل الزيارة"
        subtitle={`${String(facility?.facility_name || "منشأة غير محددة")}${
          building ? ` · ${building.building_name}` : ""
        }`}
      />

      {activeAsset ? (
        <section className="card">
          <div className="section-title">الأصل الجاري فحصه</div>
          <div className="section-subtitle">
            {String(activeAsset.asset_name_ar || activeAsset.asset_name || "أصل")}
            {activeAsset.asset_code ? ` · ${String(activeAsset.asset_code)}` : ""}
            {activeAsset.location_note ? ` · ${String(activeAsset.location_note)}` : ""}
          </div>
        </section>
      ) : null}

      <div className="stats-grid">
        <StatCard
          label="الأنظمة"
          value={systems.length}
          hint="عدد الأنظمة داخل الزيارة"
          icon={ShieldCheck}
          tone="teal"
        />
        <StatCard
          label="مطابق"
          value={compliantCount}
          hint="عدد البنود المطابقة"
          icon={ClipboardList}
          tone="slate"
        />
        <StatCard
          label="غير مطابق"
          value={nonCompliantCount}
          hint="عدد البنود غير المطابقة"
          icon={ClipboardList}
          tone={nonCompliantCount > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="المخالفات المفتوحة"
          value={openFindingsCount}
          hint="تحتاج متابعة"
          icon={FileCheck2}
          tone={openFindingsCount > 0 ? "red" : "slate"}
        />
      </div>

      <div className="visit-summary-grid">
        <div className="card">
          <div className="section-title">ملخص الزيارة</div>

          <div className="section-header-row" style={{ marginTop: "12px" }}>
            <div className="section-header-side">
              <StatusBadge status={String(visit?.visit_status || "planned")} />
              <span className="badge">
                النتيجة: {String(visit?.summary_result || "pending")}
              </span>
            </div>
            <span className="badge">
              التاريخ: {String(visit?.planned_date || visit?.visit_date || "-")}
            </span>
          </div>

          <ComplianceProgress value={overallCompliance} />

          <div className="visit-kpi-row">
            <span className="visit-kpi-pill">مطابق: {compliantCount}</span>
            <span className="visit-kpi-pill">غير مطابق: {nonCompliantCount}</span>
            <span className="visit-kpi-pill">غير منطبق: {notApplicableCount}</span>
            <span className="visit-kpi-pill">
              الاستحقاق التالي: {String(visit?.next_due_date || "-")}
            </span>
          </div>

          <div className="visit-kpi-row">
            <span className="visit-kpi-pill">
              المفتش:{" "}
              {String(
                assignedInspector?.full_name_ar ||
                  assignedInspector?.full_name ||
                  assignedInspector?.email ||
                  "غير محدد"
              )}
            </span>
            {assignedInspector?.phone ? (
              <span className="visit-kpi-pill">
                الجوال: {String(assignedInspector.phone)}
              </span>
            ) : null}
          </div>

          <div className="visit-card-text" style={{ marginTop: "12px" }}>
            {String(visit?.notes || "لا توجد ملاحظات مسجلة لهذه الزيارة.")}
          </div>
        </div>

        <div className="report-ready-card">
          <div className="report-ready-title">جاهزية التقرير</div>
          <div className="report-ready-text">
            {reportReady
              ? "الزيارة مغلقة وتم تسجيل نتائج فعلية، والصفحة أصبحت جاهزة للانتقال إلى مرحلة تقرير PDF الاحترافي."
              : "أكمل تنفيذ البنود وأغلق الزيارة أولًا حتى تصبح جاهزة بالكامل لمرحلة التقرير."}
          </div>

          <div className="visit-kpi-row">
            <span className="badge">
              حالة الجاهزية: {reportReady ? "جاهز" : "غير جاهز"}
            </span>
            <span className="badge">الإجابات المسجلة: {responseRows.length}</span>
            <span className="badge">المخالفات: {findingRows.length}</span>
          </div>

          <div className="visit-kpi-row">
            <span className="badge">
              المفتش المعين:{" "}
              {String(
                assignedInspector?.full_name_ar ||
                  assignedInspector?.full_name ||
                  "غير محدد"
              )}
            </span>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="section-title">نتائج الأنظمة</div>

        {systems.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد أنظمة مرتبطة"
              description="لم يتم ربط أي نظام بهذه الزيارة بعد."
              icon={ShieldCheck}
            />
          </div>
        ) : (
          <div className="system-summary-grid" style={{ marginTop: "12px" }}>
            {systems.map((system: any) => (
              <VisitSystemSummaryCard
                key={String(system.visit_system_id)}
                system={system}
              />
            ))}
          </div>
        )}
      </section>

      {systems.length > 0 ? (
        <VisitExecutionForm
          visitId={String(id)}
          visitSystems={systems.map((s: any) => ({
            visit_system_id: String(s.visit_system_id),
            building_system_id: String(s.building_system_id),
            system_code: String(s.system_code),
          }))}
          checklistItems={executionItems}
          existingResponses={existingResponses}
          existingEvidence={visitEvidence.map((row: any) => ({
            evidence_id: String(row.evidence_id || ""),
            visit_id: String(row.visit_id || ""),
            visit_system_id: String(row.visit_system_id || ""),
            checklist_item_id: String(row.checklist_item_id || ""),
            asset_id: String(row.asset_id || ""),
            evidence_type: String(row.evidence_type || ""),
            file_url: String(row.file_url || ""),
            file_name: String(row.file_name || ""),
            caption: String(row.caption || ""),
            taken_by: String(row.taken_by || ""),
            taken_at: String(row.taken_at || ""),
          }))}
          activeAsset={activeAsset}
          assetBaselines={activeAssetBaselines}
        />
      ) : null}

      <section className="card">
        <div className="section-title">قائمة الفحص المرجعية</div>

        {executionItems.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد قائمة فحص"
              description="لم يتم العثور على Checklist للأنظمة المرتبطة بهذه الزيارة."
              icon={ClipboardList}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {executionItems.slice(0, 10).map((item: any) => (
              <div
                key={`${item.visit_system_id}-${item.checklist_item_id}`}
                className="checklist-item"
              >
                <div className="checklist-item-section">
                  {item.system_code} · {item.section_name || "Section"}
                </div>
                <div className="checklist-item-title">{item.question_text}</div>
                <div className="checklist-item-criteria">
                  {item.acceptance_criteria}
                </div>
                {item.ui_hint_ar ? (
                  <div className="section-subtitle" style={{ marginTop: "8px" }}>
                    {item.ui_hint_ar}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
