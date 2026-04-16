import { ClipboardList, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
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

  const [visits, visitSystems, facilities, buildings, responses] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
      readSheet(workbookId, "RESPONSES"),
    ]);

  const visit = visits.find((v) => String(v.visit_id) === id);
  const systems = visitSystems.filter((vs) => String(vs.visit_id) === id);

  const facility = facilities.find(
    (f) => String(f.facility_id) === String(visit?.facility_id || "")
  );

  const building = buildings.find(
    (b) => String(b.building_id) === String(visit?.building_id || "")
  );

  const checklistPerSystem = await Promise.all(
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

  const executionItems = checklistPerSystem.flat();

  const existingResponses = responses
    .filter((r) =>
      systems.some(
        (s) => String(s.visit_system_id) === String(r.visit_system_id)
      )
    )
    .map((r) => ({
      visit_system_id: String(r.visit_system_id),
      checklist_item_id: String(r.checklist_item_id),
      response_value: String(r.response_value || ""),
      finding_severity: String(r.finding_severity || ""),
      comments: String(r.comments || ""),
    }));

  return (
    <AppShell>
      <PageHeader title="تفاصيل الزيارة" subtitle={`رقم الزيارة: ${id}`} />

      <div className="info-strip">
        <div className="info-strip-card">
          <div className="info-strip-label">الحالة</div>
          <div className="info-strip-value" style={{ marginTop: "10px" }}>
            <StatusBadge status={String(visit?.visit_status || "planned")} />
          </div>
        </div>

        <div className="info-strip-card">
          <div className="info-strip-label">المنشأة / المبنى</div>
          <div className="info-strip-value">
            {String(facility?.facility_name || "غير محدد")}
            {building ? ` · ${building.building_name}` : ""}
          </div>
        </div>

        <div className="info-strip-card">
          <div className="info-strip-label">تاريخ الزيارة</div>
          <div className="info-strip-value">
            {String(visit?.planned_date || visit?.visit_date || "-")}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">ملخص الزيارة</div>
        <div className="section-subtitle">
          {String(visit?.summary_result || "pending")}
        </div>
        <div className="visit-card-text">
          {String(visit?.notes || "لا توجد ملاحظات")}
        </div>
      </div>

      <div className="card">
        <div
          className="section-title"
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <ShieldCheck size={18} />
          <span>الأنظمة ضمن الزيارة</span>
        </div>

        {systems.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد أنظمة مرتبطة"
              description="لم يتم ربط أي نظام بهذه الزيارة بعد."
              icon={ShieldCheck}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {systems.map((s) => (
              <div key={String(s.visit_system_id)} className="visit-item">
                <div className="visit-item-top">
                  <div>
                    <div className="visit-item-title">{String(s.system_code)}</div>
                    <div className="visit-item-date">
                      نسبة الامتثال: {String(s.compliance_percent || "0")}%
                    </div>
                  </div>

                  <StatusBadge status={String(s.status || "planned")} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      <div className="card">
        <div
          className="section-title"
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <ClipboardList size={18} />
          <span>قائمة الفحص المرجعية</span>
        </div>

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
      </div>
    </AppShell>
  );
}
