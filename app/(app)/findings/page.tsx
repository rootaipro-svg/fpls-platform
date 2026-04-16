import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { FindingCard } from "@/components/finding-card";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function severityRank(severity: string) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical") return 0;
  if (s === "major") return 1;
  if (s === "minor") return 2;
  return 3;
}

export default async function FindingsPage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [findings, visitSystems, visits, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const sortedFindings = [...findings].sort((a, b) => {
    const aClosed = String(a.closure_status || "").toLowerCase() === "closed" ? 1 : 0;
    const bClosed = String(b.closure_status || "").toLowerCase() === "closed" ? 1 : 0;

    if (aClosed !== bClosed) return aClosed - bClosed;
    return severityRank(String(a.severity)) - severityRank(String(b.severity));
  });

  const openCount = findings.filter(
    (f) => String(f.closure_status || f.compliance_status || "").toLowerCase() !== "closed"
  ).length;

  const criticalCount = findings.filter(
    (f) => String(f.severity || "").toLowerCase() === "critical"
  ).length;

  const closedCount = findings.filter(
    (f) => String(f.closure_status || "").toLowerCase() === "closed"
  ).length;

  return (
    <AppShell>
      <PageHeader
        title="المخالفات"
        subtitle="متابعة الملاحظات التصحيحية والمخالفات المفتوحة والمغلقة"
      />

      <div className="findings-summary">
        <StatCard label="المفتوحة" value={openCount} hint="المخالفات التي تحتاج متابعة" />
        <StatCard label="الحرجة" value={criticalCount} hint="أولوية عالية" />
        <StatCard label="المغلقة" value={closedCount} hint="تم التحقق والإغلاق" />
      </div>

      {sortedFindings.length === 0 ? (
        <EmptyState
          title="لا توجد مخالفات"
          description="عند تسجيل بند غير مطابق داخل الزيارات ستظهر المخالفات هنا."
          icon={ShieldAlert}
        />
      ) : (
        <div className="stack-3">
          {sortedFindings.map((finding) => {
            const visitSystem = visitSystems.find(
              (vs) => String(vs.visit_system_id) === String(finding.visit_system_id)
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
              <FindingCard
                key={String(finding.finding_id)}
                finding={finding}
                facilityName={String(facility?.facility_name || "")}
                buildingName={String(building?.building_name || "")}
                systemCode={String(visitSystem?.system_code || "")}
              />
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
