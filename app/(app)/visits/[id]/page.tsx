import { ClipboardList, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
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

  const [visits, visitSystems, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const visit = visits.find((v) => String(v.visit_id) === id);
  const systems = visitSystems.filter((vs) => String(vs.visit_id) === id);

  const facility = facilities.find(
    (f) => String(f.facility_id) === String(visit?.facility_id || "")
  );

  const building = buildings.find(
    (b) => String(b.building_id) === String(visit?.building_id || "")
  );

  const firstSystemCode = String(systems[0]?.system_code || "");
  const checklist = firstSystemCode
    ? await getChecklistForSystem(workbookId, firstSystemCode)
    : [];

  return (
    <AppShell>
      <PageHeader
        title={`تفاصيل الزيارة`}
        subtitle={`رقم الزيارة: ${id}`}
      />

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
        <div className="section-title" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

      <div className="card">
        <div className="section-title" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <ClipboardList size={18} />
          <span>قائمة الفحص</span>
        </div>

        {checklist.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد قائمة فحص"
              description="لم يتم العثور على Checklist لهذا النظام بعد."
              icon={ClipboardList}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {checklist.slice(0, 12).map((item) => (
              <div key={String(item.checklist_item_id)} className="checklist-item">
                <div className="checklist-item-section">
                  {String(item.section_name || "Section")}
                </div>
                <div className="checklist-item-title">
                  {String(item.question_text || "")}
                </div>
                <div className="checklist-item-criteria">
                  {String(item.acceptance_criteria || "")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
