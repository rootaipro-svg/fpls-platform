import { UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SeverityBadge } from "@/components/severity-badge";
import { FindingStatusBadge } from "@/components/finding-status-badge";
import FindingUpdateForm from "@/components/finding-update-form";
import { requirePermission } from "@/lib/permissions";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";
import { readSheet } from "@/lib/sheets";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("findings", "view");
  const workbookId = actor.workbookId;

  const [findings, visitSystems, visits, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const finding = findings.find(
    (f: any) => String(f.finding_id) === String(id)
  );

  const visitSystem = visitSystems.find(
    (vs: any) => String(vs.visit_system_id) === String(finding?.visit_system_id || "")
  );

  const visit = visits.find(
    (v: any) => String(v.visit_id) === String(visitSystem?.visit_id || "")
  );

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(workbookId, actor)
      : null;

  if (actor.role === "inspector") {
    if (!currentInspector) {
      return (
        <AppShell>
          <PageHeader
            title="تفاصيل المخالفة"
            subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
          />
          <EmptyState
            title="تعذر فتح المخالفة"
            description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
            icon={UserRound}
          />
        </AppShell>
      );
    }

    if (!isVisitAssignedToInspector(visit, String(currentInspector.inspector_id))) {
      return (
        <AppShell>
          <PageHeader title="تفاصيل المخالفة" subtitle="غير مصرح" />
          <EmptyState
            title="هذه المخالفة ليست من زياراتك"
            description="يمكنك فقط الوصول إلى المخالفات الناتجة من الزيارات المعيّنة لك."
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

  if (!finding) {
    return (
      <AppShell>
        <PageHeader
          title="تفاصيل المخالفة"
          subtitle={`رقم المخالفة: ${String(id)}`}
        />
        <EmptyState
          title="المخالفة غير موجودة"
          description="تعذر العثور على السجل المطلوب."
          icon={UserRound}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="تفاصيل المخالفة"
        subtitle={`رقم المخالفة: ${String(finding.finding_code || id)}`}
      />

      <div className="card">
        <div className="section-header-row">
          <div className="section-header-side">
            <FindingStatusBadge
              status={String(
                finding.closure_status || finding.compliance_status || "open"
              )}
            />
            <SeverityBadge severity={String(finding.severity || "")} />
          </div>
        </div>

        <div className="section-title" style={{ marginTop: "14px" }}>
          {String(finding.title || "مخالفة")}
        </div>

        <div className="section-subtitle" style={{ marginTop: "8px" }}>
          {String(finding.description || "لا يوجد وصف")}
        </div>

        <div className="stack-3" style={{ marginTop: "18px" }}>
          <div>
            <div className="text-sm text-slate-500">الكود</div>
            <div className="mt-1 font-medium">
              {String(finding.finding_code || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">النظام</div>
            <div className="mt-1 font-medium">
              {String(visitSystem?.system_code || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">المنشأة / المبنى</div>
            <div className="mt-1 font-medium">
              {String(facility?.facility_name || "-")}
              {building ? ` · ${building.building_name}` : ""}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">الإجراء التصحيحي الحالي</div>
            <div className="mt-1 font-medium">
              {String(finding.corrective_action || "غير مسجل")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">المسؤول</div>
            <div className="mt-1 font-medium">
              {String(finding.responsible_party || "غير محدد")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">الإغلاق المستهدف</div>
            <div className="mt-1 font-medium">
              {String(finding.target_close_date || "-")}
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-500">الإغلاق الفعلي</div>
            <div className="mt-1 font-medium">
              {String(finding.actual_close_date || "-")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <FindingUpdateForm finding={finding} />
      </div>
    </AppShell>
  );
}
