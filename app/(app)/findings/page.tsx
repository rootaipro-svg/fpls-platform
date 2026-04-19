import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { MetricCard } from "@/components/metric-card";
import { FindingCard } from "@/components/finding-card";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

export default async function FindingsPage() {
  const actor = await requirePermission("findings", "view");

  const [findings, visits, facilities, buildings] = await Promise.all([
    readSheet(actor.workbookId, "FINDINGS"),
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
  ]);

  const openFindings = findings.filter((f: any) => {
    const status = String(
      f.closure_status || f.compliance_status || ""
    ).toLowerCase();
    return status !== "closed";
  });

  const criticalFindings = openFindings.filter(
    (f: any) => String(f.severity || "").toLowerCase() === "critical"
  );

  const closedFindings = findings.filter((f: any) => {
    const status = String(
      f.closure_status || f.compliance_status || ""
    ).toLowerCase();
    return status === "closed";
  });

  const sortedFindings = sortByDateDesc(findings, "updated_at");

  return (
    <AppShell>
      <PageHero
        eyebrow="متابعة الملاحظات التصحيحية والمخالفات المفتوحة والمغلقة"
        title="المخالفات"
        subtitle="عرض موحد للمخالفات وحالتها الحالية"
      />

      <div className="space-y-4">
        <MetricCard
          title="المفتوحة"
          value={openFindings.length}
          subtitle="المخالفات التي تحتاج متابعة"
          icon={ShieldAlert}
          tone="amber"
        />

        <MetricCard
          title="الحرجة"
          value={criticalFindings.length}
          subtitle="أولوية عالية"
          icon={ShieldAlert}
          tone="red"
        />

        <MetricCard
          title="المغلقة"
          value={closedFindings.length}
          subtitle="تم التحقق والإغلاق"
          icon={ShieldAlert}
          tone="slate"
        />

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">قائمة المخالفات</div>
          </div>

          {sortedFindings.length === 0 ? (
            <EmptyState
              title="لا توجد مخالفات"
              description="ستظهر هنا المخالفات بعد تسجيل نتائج غير مطابقة."
              icon={ShieldAlert}
            />
          ) : (
            <div className="space-y-4">
              {sortedFindings.map((finding: any) => {
                const visit = visits.find(
                  (v: any) =>
                    String(v.visit_id) === String(finding.visit_id || "")
                );

                const facility = facilities.find(
                  (f: any) =>
                    String(f.facility_id) === String(visit?.facility_id || "")
                );

                const building = buildings.find(
                  (b: any) =>
                    String(b.building_id) === String(visit?.building_id || "")
                );

                return (
                  <FindingCard
                    key={String(finding.finding_id)}
                    finding={finding}
                    facilityName={String(facility?.facility_name || "")}
                    buildingName={String(building?.building_name || "")}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
