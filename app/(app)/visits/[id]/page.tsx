import { ClipboardList, FileCheck2, ShieldCheck, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { ComplianceProgress } from "@/components/compliance-progress";
import { VisitSystemSummaryCard } from "@/components/visit-system-summary-card";
import VisitExecutionForm from "@/components/visit-execution-form";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";
import { getChecklistForSystem } from "@/lib/checklist";

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [visits, visitSystems, facilities, buildings, responses, findings, inspectors] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
      readSheet(workbookId, "RESPONSES"),
      readSheet(workbookId, "FINDINGS"),
      readSheet(workbookId, "INSPECTORS"),
    ]);

  const visit = visits.find((v) => String(v.visit_id) === id);
  const systems = visitSystems.filter((vs) => String(vs.visit_id) === id);

  const facility = facilities.find(
    (f) => String(f.facility_id) === String(visit?.facility_id || "")
  );

  const building = buildings.find(
    (b) => String(b.building_id) === String(visit?.building_id || "")
  );

  const assignedInspector = inspectors.find(
    (i) => String(i.inspector_id) === String(visit?.assigned_inspector_id || "")
  );

  const visitSystemIds = new Set(systems.map((s) => String(s.visit_system_id)));

  const responseRows = responses.filter((r) =>
    visitSystemIds.has(String(r.visit_system_id))
  );

  const findingRows = findings.filter((f) =>
    visitSystemIds.has(String(f.visit_system_id))
  );

  const compliantCount = responseRows.filter(
    (r) => String(r.response_value || "").toLowerCase() === "compliant"
  ).length;

  const nonCompliantCount = responseRows.filter(
    (r) => String(r.response_value || "").toLowerCase() === "non_compliant"
  ).length;

  const notApplicableCount = responseRows.filter(
    (r) => String(r.response_value || "").toLowerCase() === "not_applicable"
  ).length;

  const scoredTotal = compliantCount + nonCompliantCount;
  const overallCompliance =
    scoredTotal > 0 ? Math.round((compliantCount / scoredTotal) * 100) : 0;

  const openFindingsCount = findingRows.filter(
    (f) =>
      String(f.closure_status || f.compliance_status || "").toLowerCase() !==
      "closed"
  ).length;

  const executionItemsNested = await Promise.all(
    systems.map(async (system) => {
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
      }));
    })
  );

  const executionItems = executionItemsNested.flat();

  const existingResponses = responseRows.map((r) => ({
    visit_system_id: String(r.visit_system_id),
    checklist_item_id: String(r.checklist_item_id),
    response_value: String(r.response_value || ""),
    finding_severity: String(r.finding_severity || ""),
    comments: String(r.comments || ""),
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
            <span className="visit-kpi-pill">
              غير مطابق: {nonCompliantCount}
            </span>
            <span className="visit-kpi-pill">
              غير منطبق: {notApplicableCount}
            </span>
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
            {systems.map((system) => (
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
          visitSystems={systems.map((s) => ({
            visit_system_id: String(s.visit_system_id),
            building_system_id: String(s.building_system_id),
            system_code: String(s.system_code),
          }))}
          checklistItems={executionItems}
          existingResponses={existingResponses}
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
            {executionItems.slice(0, 10).map((item) => (
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
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
