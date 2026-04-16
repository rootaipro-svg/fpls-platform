import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SeverityBadge } from "@/components/severity-badge";
import { FindingStatusBadge } from "@/components/finding-status-badge";
import FindingUpdateForm from "@/components/finding-update-form";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [findings, visitSystems, visits, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const finding = findings.find((f) => String(f.finding_id) === String(id));

  const visitSystem = visitSystems.find(
    (vs) => String(vs.visit_system_id) === String(finding?.visit_system_id || "")
  );

  const visit = visits.find(
    (v) => String(v.visit_id) === String(visitSystem?.visit_id || "")
  );

  const facility = facilities.find(
    (f) => String(f.facility_id) === String(visit?.facility_id || "")
  );

  const building = buildings.find(
    (b) => String(b.building_id) === String(visit?.building_id || "")
  );

  return (
    <AppShell>
      <PageHeader
        title="تفاصيل المخالفة"
        subtitle={`رقم المخالفة: ${String(finding?.finding_id || id)}`}
      />

      <div className="detail-grid">
        <div className="detail-card">
          <div className="section-title">
            {String(finding?.title || "مخالفة")}
          </div>

          <div className="finding-card-meta" style={{ marginTop: "12px" }}>
            <SeverityBadge severity={String(finding?.severity || "")} />
            <FindingStatusBadge
              status={String(finding?.closure_status || finding?.compliance_status || "open")}
            />
          </div>

          <div className="detail-value" style={{ marginTop: "14px" }}>
            {String(finding?.description || "لا يوجد وصف")}
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-label">الكود</div>
          <div className="detail-value">
            {String(finding?.finding_code || "-")}
          </div>

          <div className="detail-label" style={{ marginTop: "14px" }}>
            النظام
          </div>
          <div className="detail-value">
            {String(visitSystem?.system_code || "-")}
          </div>

          <div className="detail-label" style={{ marginTop: "14px" }}>
            المنشأة / المبنى
          </div>
          <div className="detail-value">
            {String(facility?.facility_name || "-")}
            {building ? ` · ${building.building_name}` : ""}
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-label">الإجراء التصحيحي الحالي</div>
          <div className="detail-value">
            {String(finding?.corrective_action || "غير مسجل")}
          </div>

          <div className="detail-label" style={{ marginTop: "14px" }}>
            المسؤول
          </div>
          <div className="detail-value">
            {String(finding?.responsible_party || "غير محدد")}
          </div>

          <div className="detail-label" style={{ marginTop: "14px" }}>
            الإغلاق المستهدف
          </div>
          <div className="detail-value">
            {String(finding?.target_close_date || "-")}
          </div>

          <div className="detail-label" style={{ marginTop: "14px" }}>
            الإغلاق الفعلي
          </div>
          <div className="detail-value">
            {String(finding?.actual_close_date || "-")}
          </div>
        </div>

        {finding ? <FindingUpdateForm finding={finding} /> : null}
      </div>
    </AppShell>
  );
}
