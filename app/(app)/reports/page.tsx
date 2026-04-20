import Link from "next/link";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  EmptyPanel,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import {
  isClosedVisitStatus,
  toSummaryResultLabel,
  toVisitTypeLabel,
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

export default async function ReportsPage() {
  const actor = await requirePermission("reports", "view");

  const [visits, facilities, buildings] = await Promise.all([
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
  ]);

  const reportReadyVisits = sortByDateDesc(
    visits.filter((visit: any) => isClosedVisitStatus(visit.visit_status)),
    "visit_date"
  );

  const compliantCount = reportReadyVisits.filter(
    (visit: any) => String(visit.summary_result || "").toLowerCase() === "compliant"
  ).length;

  const remarksCount = reportReadyVisits.filter(
    (visit: any) => String(visit.summary_result || "").toLowerCase() !== "compliant"
  ).length;

  return (
    <AppShell>
      <PageHero
        eyebrow="التقارير الجاهزة للطباعة والعرض"
        title="التقارير"
        subtitle="الزيارات المغلقة والجاهزة للعرض والتصدير"
        icon={FileText}
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
          label="إجمالي التقارير"
          value={reportReadyVisits.length}
          hint="كل الزيارات القابلة للعرض كتقرير"
          icon={FileText}
          tone="teal"
        />
        <MetricCard
          label="جاهز للطباعة"
          value={reportReadyVisits.length}
          hint="زيارات مغلقة مع نتائج"
          icon={FileText}
          tone="slate"
        />
        <MetricCard
          label="مطابق"
          value={compliantCount}
          hint="زيارات نتيجتها مطابقة"
          icon={FileText}
          tone="teal"
        />
        <MetricCard
          label="مع ملاحظات"
          value={remarksCount}
          hint="تحتاج مراجعة النتائج"
          icon={FileText}
          tone="amber"
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="قائمة التقارير"
          subtitle="الوصول إلى الزيارات المغلقة الجاهزة للتقرير"
        >
          {reportReadyVisits.length === 0 ? (
            <EmptyPanel
              title="لا توجد تقارير جاهزة"
              description="عند إغلاق زيارة مع نتائج ستظهر هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {reportReadyVisits.map((visit: any) => {
                const facility = facilities.find(
                  (f: any) =>
                    String(f.facility_id || "") === String(visit.facility_id || "")
                );

                const building = buildings.find(
                  (b: any) =>
                    String(b.building_id || "") === String(visit.building_id || "")
                );

                const compliant =
                  String(visit.summary_result || "").toLowerCase() === "compliant";

                return (
                  <Link
                    key={String(visit.visit_id)}
                    href={`/reports/${String(visit.visit_id)}`}
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
                          {toVisitTypeLabel(visit.visit_type)}
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
                          {` · التاريخ: ${String(visit.visit_date || visit.planned_date || "-")}`}
                        </div>
                      </div>

                      <SoftBadge
                        label={compliant ? "مطابق" : "مع ملاحظات"}
                        tone={compliant ? "teal" : "amber"}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "13px",
                        color: "#64748b",
                        lineHeight: 1.7,
                      }}
                    >
                      {toSummaryResultLabel(visit.summary_result)}
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#0f766e",
                      }}
                    >
                      فتح التقرير
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
