import { ShieldAlert, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { FindingCard } from "@/components/finding-card";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";

function severityRank(severity: string) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical") return 0;
  if (s === "major") return 1;
  if (s === "minor") return 2;
  return 3;
}

export default async function FindingsPage() {
  const actor = await requirePermission("findings", "view");
  const workbookId = actor.workbookId;

  const [findings, visitSystems, visits, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(workbookId, actor)
      : null;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
        <PageHeader
          title="المخالفات"
          subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
        />
        <EmptyState
          title="تعذر تحميل المخالفات"
          description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
          icon={UserRound}
        />
      </AppShell>
    );
  }

  const visibleVisits =
    actor.role === "inspector"
      ? visits.filter((visit: any) =>
          isVisitAssignedToInspector(
            visit,
            String(currentInspector?.inspector_id || "")
          )
        )
      : visits;

  const visibleVisitIds = new Set(
    visibleVisits.map((v: any) => String(v.visit_id))
  );

  const visibleVisitSystems = visitSystems.filter((vs: any) =>
    visibleVisitIds.has(String(vs.visit_id))
  );

  const visibleVisitSystemIds = new Set(
    visibleVisitSystems.map((vs: any) => String(vs.visit_system_id))
  );

  const visibleFindings = findings.filter((f: any) =>
    visibleVisitSystemIds.has(String(f.visit_system_id))
  );

  const sortedFindings = [...visibleFindings].sort((a: any, b: any) => {
    const aClosed =
      String(a.closure_status || a.compliance_status || "").toLowerCase() === "closed"
        ? 1
        : 0;
    const bClosed =
      String(b.closure_status || b.compliance_status || "").toLowerCase() === "closed"
        ? 1
        : 0;

    if (aClosed !== bClosed) return aClosed - bClosed;
    return (
      severityRank(String(a.severity || "")) -
      severityRank(String(b.severity || ""))
    );
  });

  const openCount = visibleFindings.filter(
    (f: any) =>
      String(f.closure_status || f.compliance_status || "").toLowerCase() !== "closed"
  ).length;

  const criticalCount = visibleFindings.filter(
    (f: any) => String(f.severity || "").toLowerCase() === "critical"
  ).length;

  const closedCount = visibleFindings.filter(
    (f: any) => String(f.closure_status || "").toLowerCase() === "closed"
  ).length;

  return (
    <AppShell>
      <PageHeader
        title="المخالفات"
        subtitle={
          actor.role === "inspector"
            ? "المخالفات الناتجة من زياراتك فقط"
            : "متابعة الملاحظات التصحيحية والمخالفات المفتوحة والمغلقة"
        }
      />

      <div className="stats-grid">
        <StatCard
          label="المفتوحة"
          value={openCount}
          hint="المخالفات التي تحتاج متابعة"
          icon={ShieldAlert}
          tone={openCount > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="الحرجة"
          value={criticalCount}
          hint="أولوية عالية"
          icon={ShieldAlert}
          tone={criticalCount > 0 ? "red" : "slate"}
        />
        <StatCard
          label="المغلقة"
          value={closedCount}
          hint="تم التحقق والإغلاق"
          icon={ShieldAlert}
          tone="slate"
        />
      </div>

      <section className="card">
        <div className="section-title">
          {actor.role === "inspector" ? "مخالفاتي" : "قائمة المخالفات"}
        </div>

        {sortedFindings.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد مخالفات"
              description={
                actor.role === "inspector"
                  ? "لا توجد مخالفات مرتبطة بزياراتك حاليًا."
                  : "لا توجد مخالفات في النظام حاليًا."
              }
              icon={ShieldAlert}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {sortedFindings.map((finding: any) => {
              const visitSystem = visibleVisitSystems.find(
                (vs: any) =>
                  String(vs.visit_system_id) === String(finding.visit_system_id)
              );

              const visit = visibleVisits.find(
                (v: any) => String(v.visit_id) === String(visitSystem?.visit_id || "")
              );

              const facility = facilities.find(
                (f: any) => String(f.facility_id) === String(visit?.facility_id || "")
              );

              const building = buildings.find(
                (b: any) => String(b.building_id) === String(visit?.building_id || "")
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
      </section>
    </AppShell>
  );
}
