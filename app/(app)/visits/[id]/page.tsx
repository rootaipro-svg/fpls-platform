import {
  ClipboardList,
  FileCheck2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import VisitExecutionForm from "@/components/visit-execution-form";
import {
  EmptyPanel,
  ListRow,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import { toFindingSeverityLabel } from "@/lib/display";
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

function toneForSummary(value: any) {
  const v = String(value || "").toLowerCase();

  if (v === "compliant") return "teal" as const;
  if (v === "critical_findings" || v === "fail_critical") return "red" as const;
  if (v === "non_compliant" || v === "pass_with_remarks") return "amber" as const;

  return "slate" as const;
}

function toneForStatus(value: any) {
  const v = String(value || "").toLowerCase();

  if (v === "closed" || v === "completed") return "teal" as const;
  if (v === "in_progress" || v === "inprogress" || v === "open") return "amber" as const;

  return "slate" as const;
}


function responseLabel(value: any) {
  const normalized = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    compliant: "مطابق",
    non_compliant: "غير مطابق",
    not_applicable: "غير منطبق",
    pass: "ناجح",
    fail: "فاشل",
    check: "يحتاج مراجعة",
  };

  return map[normalized] || safeText(value, "-");
}
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
  ]);

  const visit = visits.find((v: any) => String(v.visit_id) === String(id));
  const systems = visitSystems.filter((vs: any) => String(vs.visit_id) === String(id));

  if (!visit) {
    return (
      <AppShell>
        <SectionCard title="تفاصيل الزيارة" subtitle="تعذر العثور على الزيارة المطلوبة">
          <EmptyPanel
            title="الزيارة غير موجودة"
            description="قد يكون الرابط غير صحيح أو تم حذف الزيارة."
          />
        </SectionCard>
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
          <SectionCard
            title="تفاصيل الزيارة"
            subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
          >
            <EmptyPanel
              title="تعذر فتح الزيارة"
              description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
            />
          </SectionCard>
        </AppShell>
      );
    }

    if (!isVisitAssignedToInspector(visit, String(currentInspector.inspector_id))) {
      return (
        <AppShell>
          <SectionCard title="تفاصيل الزيارة" subtitle="غير مصرح">
            <EmptyPanel
              title="هذه الزيارة ليست مخصصة لك"
              description="يمكنك فقط الوصول إلى الزيارات المعيّنة لحسابك."
            />
          </SectionCard>
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

  const visitSystemIds = new Set(systems.map((s: any) => String(s.visit_system_id || "")));
  const visitBuildingSystemIds = new Set(
    systems.map((s: any) => String(s.building_system_id || ""))
  );

  const responseRows = responses.filter((r: any) =>
    visitSystemIds.has(String(r.visit_system_id || ""))
  );

  const findingRows = findings.filter((f: any) =>
    visitSystemIds.has(String(f.visit_system_id || ""))
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

  const compliantCount = responseRows.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "compliant"
  ).length;

  const nonCompliantCount = responseRows.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "non_compliant"
  ).length;

  const notApplicableCount = responseRows.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "not_applicable"
  ).length;

  const openFindingsCount = findingRows.filter((f: any) =>
    isOpenFindingStatus(f.closure_status || f.compliance_status || "")
  ).length;

  const executionItemsNested = await Promise.all(
    systems.map(async (system: any) => {
      const items = await getChecklistForSystem(
        workbookId,
        String(system.system_code || "")
      );

      return items.map((item: any) => ({
        visit_system_id: String(system.visit_system_id || ""),
        building_system_id: String(system.building_system_id || ""),
        system_code: String(system.system_code || ""),
        checklist_item_id: String(item.checklist_item_id || ""),
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

  const reportReady =
    String(visit?.visit_status || "").toLowerCase() === "closed" ||
    String(visit?.visit_status || "").toLowerCase() === "completed";

  return (
    <AppShell>
      <PageHero
        eyebrow="تفاصيل الزيارة والتنفيذ الفعلي والنتائج"
        title={safeText(
          facility?.facility_name,
          "منشأة غير محددة"
        )}
        subtitle={`${building ? `${String(building.building_name || "")} · ` : ""}${String(
          visit.planned_date || visit.visit_date || "-"
        )}`}
        icon={ClipboardList}
        pills={[
          toVisitStatusLabel(visit?.visit_status),
          toSummaryResultLabel(visit?.summary_result || "pending"),
        ]}
      />

      {activeAsset ? (
        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="الأصل الجاري فحصه"
            subtitle="هذه الزيارة مفتوحة على أصل محدد داخل النظام"
          >
            <div className="card" style={{ padding: "14px" }}>
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.5,
                }}
              >
                {safeText(activeAsset.asset_name_ar || activeAsset.asset_name, "أصل")}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontSize: "13px",
                  color: "#64748b",
                  lineHeight: 1.7,
                }}
              >
                {safeText(activeAsset.asset_code, "-")} ·{" "}
                {toSystemLabel(activeAsset.system_code)}
              </div>

              {activeAsset.location_note ? (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  {String(activeAsset.location_note)}
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>
      ) : null}

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
          hint="عدد الأنظمة داخل الزيارة"
          icon={ShieldCheck}
          tone="teal"
        />
        <MetricCard
          label="مطابق"
          value={compliantCount}
          hint="عدد البنود المطابقة"
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
          hint="مفتوحة وتحتاج متابعة"
          icon={FileCheck2}
          tone={openFindingsCount > 0 ? "red" : "slate"}
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="ملخص الزيارة"
          subtitle="الحالة العامة والمفتش والنتيجة الحالية"
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
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {toVisitStatusLabel(visit?.visit_status)}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>النتيجة</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {toSummaryResultLabel(visit?.summary_result || "pending")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>المفتش</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
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
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {String(visit?.planned_date || visit?.visit_date || "-")}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <SoftBadge
              label={`غير منطبق: ${notApplicableCount}`}
              tone="slate"
            />
          </div>

          <div
            className="card"
            style={{
              padding: "14px",
              marginTop: "10px",
            }}
          >
            <div style={{ fontSize: "13px", color: "#64748b" }}>ملاحظات الزيارة</div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "14px",
                color: "#334155",
                lineHeight: 1.8,
              }}
            >
              {safeText(visit?.notes, "لا توجد ملاحظات مسجلة لهذه الزيارة.")}
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <SoftBadge
              label={reportReady ? "جاهزة للتقرير" : "غير جاهزة للتقرير"}
              tone={reportReady ? "teal" : "amber"}
            />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="الأنظمة داخل الزيارة"
          subtitle="الأنظمة المشمولة ضمن هذه الزيارة"
        >
          {systems.length === 0 ? (
            <EmptyPanel
              title="لا توجد أنظمة"
              description="لم يتم ربط أي نظام بهذه الزيارة بعد."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {systems.map((system: any) => (
                <ListRow
                  key={String(system.visit_system_id || "")}
                  href={`/visits/${String(id)}`}
                  title={toSystemLabel(system.system_code)}
                  subtitle={`النظام: ${safeText(system.system_code, "-")}`}
                  rightBadge={
                    <SoftBadge
                      label={safeText(system.status || system.result_summary, "system")}
                      tone={toneForSummary(system.result_summary || system.status)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {systems.length > 0 ? (
        <div style={{ marginTop: "14px" }}>
          <SectionCard
            title="تنفيذ الزيارة"
            subtitle="تسجيل النتائج الفعلية لكل بند"
          >
            <VisitExecutionForm
              visitId={String(id)}
              visitSystems={
                systems.map((s: any) => ({
                  visit_system_id: String(s.visit_system_id || ""),
                  building_system_id: String(s.building_system_id || ""),
                  system_code: String(s.system_code || ""),
                })) as any
              }
              checklistItems={executionItems as any}
              existingResponses={existingResponses as any}
              existingEvidence={
                visitEvidence.map((row: any) => ({
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
              activeAsset={activeAsset as any}
            />
          </SectionCard>
        </div>
      ) : null}

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="آخر النتائج المسجلة"
          subtitle="أحدث الإجابات التي تم حفظها في هذه الزيارة"
        >
          {responseRows.length === 0 ? (
            <EmptyPanel
              title="لا توجد نتائج"
              description="عند تنفيذ الفحص ستظهر النتائج هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {responseRows.slice(0, 8).map((row: any) => (
                <ListRow
                  key={String(row.response_id || "")}
                  href={`/visits/${String(id)}`}
                  title={responseLabel(row.response_value)}
                  subtitle={safeText(row.comments, "بدون ملاحظات")}
                  rightBadge={
                    <SoftBadge
                      label={safeText(row.response_at || row.updated_at, "-")}
                      tone={
                        String(row.response_value || "").toLowerCase() === "non_compliant"
                          ? "amber"
                          : "teal"
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="المخالفات الناتجة"
          subtitle="المخالفات المرتبطة بهذه الزيارة"
        >
          {findingRows.length === 0 ? (
            <EmptyPanel
              title="لا توجد مخالفات"
              description="لم يتم تسجيل مخالفات على هذه الزيارة بعد."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {findingRows.slice(0, 8).map((finding: any) => (
                <ListRow
                  key={String(finding.finding_id || "")}
                  href={`/findings/${String(finding.finding_id || "")}`}
                  title={safeText(finding.title, "مخالفة")}
                  subtitle={safeText(finding.description, "بدون وصف")}
                  rightBadge={
                    <SoftBadge
                      label={toFindingSeverityLabel(finding.severity)}
                      tone={
                        String(finding.severity || "").toLowerCase() === "critical"
                          ? "red"
                          : String(finding.severity || "").toLowerCase() === "major"
                          ? "amber"
                          : "slate"
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="قائمة الفحص المرجعية"
          subtitle="البنود المرجعية المرتبطة بالأنظمة داخل هذه الزيارة"
        >
          {executionItems.length === 0 ? (
            <EmptyPanel
              title="لا توجد قائمة فحص"
              description="لم يتم العثور على Checklist للأنظمة المرتبطة بهذه الزيارة."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {executionItems.slice(0, 10).map((item: any) => (
                <div
                  key={`${item.visit_system_id}-${item.checklist_item_id}`}
                  className="card"
                  style={{ padding: "14px" }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      lineHeight: 1.7,
                    }}
                  >
                    {toSystemLabel(item.system_code)} ·{" "}
                    {safeText(item.section_name, "Section")}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.6,
                    }}
                  >
                    {safeText(item.question_text, "-")}
                  </div>

                  {item.acceptance_criteria ? (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "13px",
                        color: "#64748b",
                        lineHeight: 1.8,
                      }}
                    >
                      {String(item.acceptance_criteria)}
                    </div>
                  ) : null}

                  {item.ui_hint_ar ? (
                    <div style={{ marginTop: "8px" }}>
                      <SoftBadge
                        label={String(item.ui_hint_ar)}
                        tone="slate"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
