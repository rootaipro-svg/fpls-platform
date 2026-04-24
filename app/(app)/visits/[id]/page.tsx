import {
  ClipboardList,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import VisitExecutionForm from "@/components/visit-execution-form";

import {
  EmptyPanel,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";

import { requirePermission } from "@/lib/permissions";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";

import { readSheet } from "@/lib/sheets";
import { getChecklistForSystem } from "@/lib/checklist";

import {
  safeText,
  toSummaryResultLabel,
  toSystemLabel,
  toVisitStatusLabel,
  isOpenFindingStatus,
} from "@/lib/display";

type Row = Record<string, any>;

function toneForSummary(value: any) {
  const v = String(value || "").toLowerCase();

  if (v === "compliant") return "teal" as const;
  if (v === "critical_findings" || v === "fail_critical") return "red" as const;
  if (v === "non_compliant" || v === "pass_with_remarks") return "amber" as const;

  return "slate" as const;
}

function latestResponseKey(row: Row) {
  return `${String(row.visit_system_id || "")}__${String(
    row.checklist_item_id || ""
  )}`;
}

function latestResponseTime(row: Row) {
  return String(
    row.response_at ||
      row.updated_at ||
      row.created_at ||
      row.timestamp ||
      ""
  );
}

function getLatestResponsesOnly(rows: Row[]) {
  const map = new Map<string, Row>();

  for (const row of rows) {
    const key = latestResponseKey(row);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, row);
      continue;
    }

    const currentTime = latestResponseTime(row);
    const existingTime = latestResponseTime(existing);

    if (currentTime.localeCompare(existingTime) >= 0) {
      map.set(key, row);
    }
  }

  return Array.from(map.values());
}

function itemText(item: Row, arKey: string, enKey: string) {
  return String(item?.[arKey] || item?.[enKey] || "").trim();
}

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
  ] = await Promise.all([
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "RESPONSES"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "INSPECTORS"),
    readSheet(workbookId, "EVIDENCE"),
  ]);

  const visit = visits.find((v: Row) => String(v.visit_id) === String(id));
  const systems = visitSystems.filter(
    (vs: Row) => String(vs.visit_id) === String(id)
  );

  if (!visit) {
    return (
      <AppShell>
        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="تفاصيل الزيارة"
            subtitle="تعذر العثور على الزيارة المطلوبة"
          >
            <EmptyPanel
              title="الزيارة غير موجودة"
              description="قد يكون الرابط غير صحيح أو تم حذف الزيارة."
            />
          </SectionCard>
        </div>
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
          <div style={{ marginTop: "14px" }}>
            <SectionCard
              title="تفاصيل الزيارة"
              subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
            >
              <EmptyPanel
                title="تعذر فتح الزيارة"
                description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
              />
            </SectionCard>
          </div>
        </AppShell>
      );
    }

    if (!isVisitAssignedToInspector(visit, String(currentInspector.inspector_id))) {
      return (
        <AppShell>
          <div style={{ marginTop: "14px" }}>
            <SectionCard title="تفاصيل الزيارة" subtitle="غير مصرح">
              <EmptyPanel
                title="هذه الزيارة ليست مخصصة لك"
                description="يمكنك فقط الوصول إلى الزيارات المعيّنة لحسابك."
              />
            </SectionCard>
          </div>
        </AppShell>
      );
    }
  }

  const facility = facilities.find(
    (f: Row) => String(f.facility_id) === String(visit.facility_id || "")
  );

  const building = buildings.find(
    (b: Row) => String(b.building_id) === String(visit.building_id || "")
  );

  const assignedInspector = inspectors.find(
    (i: Row) =>
      String(i.inspector_id) === String(visit.assigned_inspector_id || "")
  );

  const visitSystemIds = new Set(
    systems.map((s: Row) => String(s.visit_system_id || ""))
  );

  const allResponseRows = responses.filter((r: Row) =>
    visitSystemIds.has(String(r.visit_system_id || ""))
  );

  const responseRows = getLatestResponsesOnly(allResponseRows);

  const findingRows = findings.filter((f: Row) =>
    visitSystemIds.has(String(f.visit_system_id || ""))
  );

  const visitEvidence = evidence.filter(
    (row: Row) => String(row.visit_id) === String(id)
  );

  const compliantCount = responseRows.filter(
    (r: Row) => String(r.response_value || "").toLowerCase() === "compliant"
  ).length;

  const nonCompliantCount = responseRows.filter(
    (r: Row) => String(r.response_value || "").toLowerCase() === "non_compliant"
  ).length;

  const notApplicableCount = responseRows.filter(
    (r: Row) => String(r.response_value || "").toLowerCase() === "not_applicable"
  ).length;

  const openFindingsCount = findingRows.filter((f: Row) =>
    isOpenFindingStatus(f.closure_status || f.compliance_status || "")
  ).length;

  const executionItemsNested = await Promise.all(
    systems.map(async (system: Row) => {
      const items = await getChecklistForSystem(
        workbookId,
        String(system.system_code || "")
      );

      return items.map((item: Row) => ({
        visit_system_id: String(system.visit_system_id || ""),
        building_system_id: String(system.building_system_id || ""),
        system_code: String(system.system_code || ""),
        checklist_item_id: String(item.checklist_item_id || ""),
        item_code: String(item.item_code || item.checklist_item_id || ""),

        section_name:
          itemText(item, "section_name_ar", "section_name") ||
          String(item.section_name || ""),

        question_text:
          itemText(item, "question_text_ar", "question_text") ||
          String(item.question_text || ""),

        acceptance_criteria:
          itemText(item, "acceptance_criteria_ar", "acceptance_criteria") ||
          String(item.acceptance_criteria || ""),

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

  const existingResponses = responseRows.map((r: Row) => ({
    visit_system_id: String(r.visit_system_id || ""),
    checklist_item_id: String(r.checklist_item_id || ""),
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

  const completedCount = responseRows.filter((r: Row) =>
    String(r.response_value || "").trim()
  ).length;

  const totalChecklistCount = executionItems.length;

  const reportReady =
    String(visit.visit_status || "").toLowerCase() === "closed" ||
    String(visit.visit_status || "").toLowerCase() === "completed";

  return (
    <AppShell>
      <PageHero
        eyebrow="زيارة فحص"
        title={safeText(facility?.facility_name_ar || facility?.facility_name, "منشأة غير محددة")}
        subtitle={`${building ? `${String(building.building_name_ar || building.building_name || "")} · ` : ""}${String(
          visit.planned_date || visit.visit_date || "-"
        )}`}
        icon={ClipboardList}
        pills={[
          toVisitStatusLabel(visit.visit_status),
          toSummaryResultLabel(visit.summary_result || "pending"),
        ]}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px",
          marginTop: "14px",
        }}
      >
        <MetricCard
          label="الأنظمة"
          value={systems.length}
          hint="داخل الزيارة"
          icon={ShieldCheck}
          tone="teal"
        />

        <MetricCard
          label="الإنجاز"
          value={`${completedCount}/${totalChecklistCount}`}
          hint="بنود تم تسجيلها"
          icon={ClipboardList}
          tone="teal"
        />

        <MetricCard
          label="غير مطابق"
          value={nonCompliantCount}
          hint="بنود تحتاج معالجة"
          icon={ClipboardList}
          tone={nonCompliantCount > 0 ? "amber" : "slate"}
        />

        <MetricCard
          label="المخالفات"
          value={openFindingsCount}
          hint="مفتوحة للمتابعة"
          icon={FileCheck2}
          tone={openFindingsCount > 0 ? "red" : "slate"}
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="ملخص الزيارة"
          subtitle="معلومات مختصرة بدون تفاصيل مشتتة"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الحالة</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {toVisitStatusLabel(visit.visit_status)}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>النتيجة</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {toSummaryResultLabel(visit.summary_result || "pending")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>المفتش</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {safeText(
                  assignedInspector?.full_name_ar ||
                    assignedInspector?.full_name ||
                    assignedInspector?.email,
                  "غير محدد"
                )}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>التاريخ</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {String(visit.planned_date || visit.visit_date || "-")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
            <SoftBadge label={`مطابق: ${compliantCount}`} tone="teal" />
            <SoftBadge
              label={`غير مطابق: ${nonCompliantCount}`}
              tone={nonCompliantCount > 0 ? "amber" : "slate"}
            />
            <SoftBadge label={`غير منطبق: ${notApplicableCount}`} tone="slate" />
            <SoftBadge
              label={reportReady ? "جاهزة للتقرير" : "غير جاهزة للتقرير"}
              tone={reportReady ? "teal" : "amber"}
            />
          </div>

          {visit.notes ? (
            <div
              className="card"
              style={{
                padding: "14px",
                marginTop: "12px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                ملاحظات الزيارة
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "14px",
                  color: "#334155",
                  lineHeight: 1.8,
                }}
              >
                {String(visit.notes)}
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="الأنظمة داخل الزيارة"
          subtitle="اختر النظام من داخل نموذج التنفيذ إذا كانت الزيارة تحتوي على أكثر من نظام"
        >
          {systems.length === 0 ? (
            <EmptyPanel
              title="لا توجد أنظمة"
              description="لم يتم ربط أي نظام بهذه الزيارة بعد."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {systems.map((system: Row) => (
                <div
                  key={String(system.visit_system_id || "")}
                  className="card"
                  style={{
                    padding: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1.5,
                      }}
                    >
                      {toSystemLabel(system.system_code)}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      {safeText(system.system_code, "-")}
                    </div>
                  </div>

                  <SoftBadge
                    label={safeText(system.status || system.result_summary, "planned")}
                    tone={toneForSummary(system.result_summary || system.status)}
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {systems.length > 0 ? (
        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="تنفيذ الفحص"
            subtitle="سجل نتيجة كل بند. هذه هي مساحة العمل الأساسية للمفتش."
          >
            <VisitExecutionForm
              visitId={String(id)}
              visitSystems={
                systems.map((s: Row) => ({
                  visit_system_id: String(s.visit_system_id || ""),
                  building_system_id: String(s.building_system_id || ""),
                  system_code: String(s.system_code || ""),
                })) as any
              }
              checklistItems={executionItems as any}
              existingResponses={existingResponses as any}
              existingEvidence={
                visitEvidence.map((row: Row) => ({
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
                })) as any
              }
              activeAsset={null as any}
            />
          </SectionCard>
        </div>
      ) : null}
    </AppShell>
  );
}
