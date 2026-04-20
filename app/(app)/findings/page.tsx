import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  EmptyPanel,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import {
  isOpenFindingStatus,
  toFindingSeverityLabel,
} from "@/lib/display";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

function severityTone(value: any) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return "red" as const;
  if (v === "major") return "amber" as const;
  return "slate" as const;
}

export default async function FindingsPage() {
  const actor = await requirePermission("findings", "view");

  const [findings, visits, facilities, buildings] = await Promise.all([
    readSheet(actor.workbookId, "FINDINGS"),
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
  ]);

  const sortedFindings = sortByDateDesc(findings, "updated_at");
  const openCount = sortedFindings.filter((f: any) =>
    isOpenFindingStatus(f.closure_status || f.compliance_status || "")
  ).length;
  const criticalCount = sortedFindings.filter(
    (f: any) => String(f.severity || "").toLowerCase() === "critical"
  ).length;
  const closedCount = sortedFindings.filter(
    (f: any) => String(f.closure_status || f.compliance_status || "").toLowerCase() === "closed"
  ).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="متابعة الملاحظات التصحيحية والمخالفات المفتوحة والمغلقة"
        title="المخالفات"
        subtitle="لوحة متابعة للمخالفات وأولويات المعالجة"
        icon={ShieldAlert}
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
          label="المفتوحة"
          value={openCount}
          hint="المخالفات التي تحتاج متابعة"
          icon={ShieldAlert}
          tone="amber"
        />
        <MetricCard
          label="الحرجة"
          value={criticalCount}
          hint="أولوية عالية"
          icon={AlertTriangle}
          tone="red"
        />
        <MetricCard
          label="المغلقة"
          value={closedCount}
          hint="تم التحقق والإغلاق"
          icon={ShieldAlert}
          tone="slate"
        />
        <MetricCard
          label="الإجمالي"
          value={sortedFindings.length}
          hint="كل المخالفات المسجلة"
          icon={ShieldAlert}
          tone="teal"
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="قائمة المخالفات"
          subtitle="عرض سريع لأحدث المخالفات المسجلة"
        >
          {sortedFindings.length === 0 ? (
            <EmptyPanel
              title="لا توجد مخالفات"
              description="عند تسجيل مخالفة جديدة ستظهر هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {sortedFindings.map((finding: any) => {
                const visit = visits.find(
                  (v: any) =>
                    String(v.visit_id || "") === String(finding.visit_id || "")
                );

                const facility = facilities.find(
                  (f: any) =>
                    String(f.facility_id || "") === String(visit?.facility_id || "")
                );

                const building = buildings.find(
                  (b: any) =>
                    String(b.building_id || "") === String(visit?.building_id || "")
                );

                const isOpen = isOpenFindingStatus(
                  finding.closure_status || finding.compliance_status || ""
                );

                return (
                  <Link
                    key={String(finding.finding_id)}
                    href={`/findings/${String(finding.finding_id)}`}
                    className="card"
                    style={{
                      display: "block",
                      padding: "16px",
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "10px",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "17px",
                            lineHeight: 1.45,
                            fontWeight: 900,
                            color: "#0f172a",
                          }}
                        >
                          {String(
                            finding.title ||
                              finding.finding_code ||
                              "مخالفة بدون عنوان"
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: "5px",
                            fontSize: "13px",
                            color: "#64748b",
                            lineHeight: 1.7,
                          }}
                        >
                          {String(facility?.facility_name || "منشأة غير محددة")}
                          {building ? ` · ${String(building.building_name || "")}` : ""}
                        </div>
                      </div>

                      <SoftBadge
                        label={isOpen ? "مفتوحة" : "مغلقة"}
                        tone={isOpen ? "amber" : "slate"}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginTop: "10px",
                      }}
                    >
                      <SoftBadge
                        label={toFindingSeverityLabel(finding.severity)}
                        tone={severityTone(finding.severity)}
                      />
                    </div>

                    {finding.description ? (
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "13px",
                          color: "#64748b",
                          lineHeight: 1.7,
                        }}
                      >
                        {String(finding.description)}
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#0f766e",
                      }}
                    >
                      فتح المخالفة
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
