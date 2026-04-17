import { Link2, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import VisitEvidenceForm from "@/components/visit-evidence-form";
import VisitEvidenceList from "@/components/visit-evidence-list";
import { requirePermission } from "@/lib/permissions";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";
import { readSheet } from "@/lib/sheets";

export default async function VisitEvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("visits", "view");
  const workbookId = actor.workbookId;

  const [visits, visitSystems, findings, evidence, facilities, buildings] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "FINDINGS"),
      readSheet(workbookId, "EVIDENCE"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
    ]);

  const visit = visits.find((v: any) => String(v.visit_id) === String(id));

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(workbookId, actor)
      : null;

  if (actor.role === "inspector") {
    if (!currentInspector) {
      return (
        <AppShell>
          <PageHeader
            title="أدلة الزيارة"
            subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
          />
          <EmptyState
            title="تعذر فتح الأدلة"
            description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
            icon={UserRound}
          />
        </AppShell>
      );
    }

    if (!isVisitAssignedToInspector(visit, String(currentInspector.inspector_id))) {
      return (
        <AppShell>
          <PageHeader title="أدلة الزيارة" subtitle="غير مصرح" />
          <EmptyState
            title="هذه الزيارة ليست مخصصة لك"
            description="يمكنك فقط الوصول إلى أدلة الزيارات المعيّنة لك."
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

  const visitSystemsRows = visitSystems.filter(
    (vs: any) => String(vs.visit_id) === String(id)
  );

  const visitSystemIds = new Set(
    visitSystemsRows.map((vs: any) => String(vs.visit_system_id))
  );

  const visitFindings = findings.filter((f: any) =>
    visitSystemIds.has(String(f.visit_system_id))
  );

  const visitEvidence = evidence
    .filter((row: any) => String(row.visit_id) === String(id))
    .sort((a: any, b: any) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );

  if (!visit) {
    return (
      <AppShell>
        <PageHeader title="أدلة الزيارة" subtitle="الزيارة غير موجودة" />
        <EmptyState
          title="تعذر العثور على الزيارة"
          description="تحقق من الرابط أو من وجود الزيارة في النظام."
          icon={Link2}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="أدلة الزيارة"
        subtitle={`${String(facility?.facility_name || "منشأة")} ${
          building ? `· ${building.building_name}` : ""
        }`}
      />

      <VisitEvidenceForm
        visitId={String(id)}
        systems={visitSystemsRows.map((row: any) => ({
          visit_system_id: String(row.visit_system_id),
          system_code: String(row.system_code || row.visit_system_id),
        }))}
        findings={visitFindings.map((row: any) => ({
          finding_id: String(row.finding_id),
          title: String(row.title || row.finding_code || row.finding_id),
        }))}
      />

      <div style={{ marginTop: "16px" }}>
        <VisitEvidenceList
          rows={visitEvidence.map((row: any) => ({
            evidence_id: String(row.evidence_id),
            evidence_type: String(row.evidence_type || ""),
            file_url: String(row.file_url || ""),
            file_name: String(row.file_name || ""),
            caption: String(row.caption || ""),
            taken_by: String(row.taken_by || ""),
            taken_at: String(row.taken_at || ""),
            visit_system_id: String(row.visit_system_id || ""),
            finding_id: String(row.finding_id || ""),
          }))}
        />
      </div>
    </AppShell>
  );
}
