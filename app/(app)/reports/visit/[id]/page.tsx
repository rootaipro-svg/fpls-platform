import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import PrintReportButton from "@/components/print-report-button";
import { SeverityBadge } from "@/components/severity-badge";
import { FindingStatusBadge } from "@/components/finding-status-badge";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function toArabicSummary(value: string) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "compliant") return "مطابق";
  if (normalized === "pass_with_remarks") return "مطابق مع ملاحظات";
  if (normalized === "fail_critical") return "غير مطابق - حرج";
  if (normalized === "pending") return "قيد الانتظار";

  return value || "غير محدد";
}

export default async function VisitReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [visits, visitSystems, responses, findings, facilities, buildings] =
    await Promise.all([
      readSheet(workbookId, "VISITS"),
      readSheet(workbookId, "VISIT_SYSTEMS"),
      readSheet(workbookId, "RESPONSES"),
      readSheet(workbookId, "FINDINGS"),
      readSheet(workbookId, "FACILITIES"),
      readSheet(workbookId, "BUILDINGS"),
    ]);

  const visit = visits.find((v) => String(v.visit_id) === String(id));

  const systems = visitSystems.filter(
    (vs) => String(vs.visit_id) === String(id)
  );

  const visitSystemIds = new Set(
    systems.map((s) => String(s.visit_system_id))
  );

  const visitResponses = responses.filter((r) =>
    visitSystemIds.has(String(r.visit_system_id))
  );

  const visitFindings = findings.filter((f) =>
    visitSystemIds.has(String(f.visit_system_id))
  );

  const facility = facilities.find(
    (f) => String(f.facility_id) === String(visit?.facility_id || "")
  );

  const building = buildings.find(
    (b) => String(b.building_id) === String(visit?.building_id || "")
  );

  const compliantCount = visitResponses.filter(
    (r) => String(r.response_value || "").toLowerCase() === "compliant"
  ).length;

  const nonCompliantCount = visitResponses.filter(
    (r) => String(r.response_value || "").toLowerCase() === "non_compliant"
  ).length;

  const notApplicableCount = visitResponses.filter(
    (r) => String(r.response_value || "").toLowerCase() === "not_applicable"
  ).length;

  const scoredTotal = compliantCount + nonCompliantCount;
  const overallCompliance =
    scoredTotal > 0 ? Math.round((compliantCount / scoredTotal) * 100) : 0;

  const reportRef = `RPT-${String(id)}`;

  return (
    <div dir="rtl" className="report-page-wrap">
      <div className="report-toolbar print-hidden">
        <div className="report-toolbar-side">
          <Link href="/reports" className="btn btn-secondary">
            <ArrowRight size={18} />
            العودة للتقارير
          </Link>

          <Link href={`/visits/${id}`} className="btn btn-secondary">
            <ClipboardList size={18} />
            فتح الزيارة
          </Link>
        </div>

        <div className="report-toolbar-side">
          <PrintReportButton />
        </div>
      </div>

      <div className="report-paper">
        <div className="report-cover">
          <div className="report-cover-eyebrow">
            منصة تفتيش أنظمة السلامة والحماية من الحريق
          </div>
          <div className="report-cover-title">تقرير زيارة تفتيش فني</div>
          <div className="report-cover-subtitle">
            تقرير قابل للطباعة والحفظ PDF لنتائج الزيارة الفنية وأنظمة الحماية من الحريق
          </div>

          <div className="report-badge-row">
            <span className="badge">رقم التقرير: {reportRef}</span>
            <span className="badge">رقم الزيارة: {String(id)}</span>
            <span className="badge">
              النتيجة: {toArabicSummary(String(visit?.summary_result || "pending"))}
            </span>
            <span className="badge">
              الحالة: {String(visit?.visit_status || "planned")}
            </span>
          </div>
        </div>

        <div className="report-content">
          <section className="report-section">
            <div className="report-section-title">البيانات الأساسية</div>
            <div className="report-section-subtitle">
              بيانات المنشأة والمبنى والزيارة الحالية
            </div>

            <div className="report-grid-2">
              <div className="report-info-box">
                <div className="report-info-label">اسم المنشأة</div>
                <div className="report-info-value">
                  {String(facility?.facility_name || "-")}
                </div>
              </div>

              <div className="report-info-box">
                <div className="report-info-label">اسم المبنى</div>
                <div className="report-info-value">
                  {String(building?.building_name || "-")}
                </div>
              </div>

              <div className="report-info-box">
                <div className="report-info-label">العنوان</div>
                <div className="report-info-value">
                  {String(facility?.address || "-")}
                </div>
              </div>

              <div className="report-info-box">
                <div className="report-info-label">التاريخ المخطط / الفعلي</div>
                <div className="report-info-value">
                  {String(visit?.planned_date || visit?.visit_date || "-")}
                </div>
              </div>

              <div className="report-info-box">
                <div className="report-info-label">نوع الزيارة</div>
                <div className="report-info-value">
                  {String(visit?.visit_type || "-")}
                </div>
              </div>

              <div className="report-info-box">
                <div className="report-info-label">النتيجة العامة</div>
                <div className="report-info-value">
                  {toArabicSummary(String(visit?.summary_result || "pending"))}
                </div>
              </div>
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-title">ملخص الامتثال</div>
            <div className="report-section-subtitle">
              قراءة سريعة لمخرجات الزيارة ونسبة الامتثال الكلية
            </div>

            <div className="report-progress-wrap">
              <div className="report-progress-bar">
                <div
                  className="report-progress-fill"
                  style={{ width: `${overallCompliance}%` }}
                />
              </div>
              <div className="report-progress-text">
                نسبة الامتثال الكلية: {overallCompliance}%
              </div>
            </div>

            <div className="report-badge-row">
              <span className="badge">مطابق: {compliantCount}</span>
              <span className="badge">غير مطابق: {nonCompliantCount}</span>
              <span className="badge">غير منطبق: {notApplicableCount}</span>
              <span className="badge">المخالفات: {visitFindings.length}</span>
              <span className="badge">
                الاستحقاق التالي: {String(visit?.next_due_date || "-")}
              </span>
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-title">نتائج الأنظمة</div>
            <div className="report-section-subtitle">
              ملخص نتائج الأنظمة المشمولة داخل هذه الزيارة
            </div>

            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>النظام</th>
                    <th>الحالة</th>
                    <th>النتيجة</th>
                    <th>الامتثال</th>
                    <th>حرج</th>
                    <th>مرتفع</th>
                    <th>منخفض</th>
                    <th>الاستحقاق التالي</th>
                  </tr>
                </thead>
                <tbody>
                  {systems.length === 0 ? (
                    <tr>
                      <td colSpan={8}>لا توجد أنظمة مرتبطة بهذه الزيارة</td>
                    </tr>
                  ) : (
                    systems.map((system) => (
                      <tr key={String(system.visit_system_id)}>
                        <td>{String(system.system_code || "-")}</td>
                        <td>{String(system.status || "-")}</td>
                        <td>{toArabicSummary(String(system.result_summary || "pending"))}</td>
                        <td>{String(system.compliance_percent || 0)}%</td>
                        <td>{String(system.critical_count || 0)}</td>
                        <td>{String(system.major_count || 0)}</td>
                        <td>{String(system.minor_count || 0)}</td>
                        <td>{String(system.next_due_date || "-")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-title">المخالفات والملاحظات</div>
            <div className="report-section-subtitle">
              البنود غير المطابقة الناتجة عن تنفيذ الزيارة
            </div>

            {visitFindings.length === 0 ? (
              <div className="report-badge-row" style={{ marginTop: "12px" }}>
                <span className="badge">لا توجد مخالفات مسجلة</span>
              </div>
            ) : (
              <div className="report-finding-list">
                {visitFindings.map((finding) => (
                  <div
                    key={String(finding.finding_id)}
                    className="report-finding-item"
                  >
                    <div className="report-finding-title">
                      {String(finding.title || "مخالفة")}
                    </div>

                    <div className="report-badge-row">
                      <SeverityBadge severity={String(finding.severity || "")} />
                      <FindingStatusBadge
                        status={String(
                          finding.closure_status ||
                            finding.compliance_status ||
                            "open"
                        )}
                      />
                      <span className="badge">
                        الكود: {String(finding.finding_code || "-")}
                      </span>
                    </div>

                    <div className="report-finding-text">
                      {String(finding.description || "لا يوجد وصف")}
                    </div>

                    <div className="report-badge-row">
                      <span className="badge">
                        الإجراء التصحيحي:{" "}
                        {String(finding.corrective_action || "غير مسجل")}
                      </span>
                      <span className="badge">
                        المسؤول: {String(finding.responsible_party || "غير محدد")}
                      </span>
                      <span className="badge">
                        الإغلاق المستهدف:{" "}
                        {String(finding.target_close_date || "-")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="report-section">
            <div className="report-section-title">ملاحظات التقرير</div>
            <div className="report-section-subtitle">
              ملخص إداري وفني نهائي
            </div>

            <div className="report-info-box" style={{ marginTop: "14px" }}>
              <div className="report-info-value">
                {String(
                  visit?.notes ||
                    "تم إعداد هذا التقرير بناءً على البيانات المسجلة داخل منصة التفتيش، ويجب مراجعته واعتماده قبل إرساله للعميل."
                )}
              </div>
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-title">الاعتماد والتوقيع</div>
            <div className="report-section-subtitle">
              مساحة اعتماد التقرير والتوقيع النهائي
            </div>

            <div className="report-signature-grid">
              <div className="report-sign-box">
                <div className="report-sign-title">إعداد التقرير</div>
                <div className="report-sign-line">الاسم / التوقيع</div>
              </div>

              <div className="report-sign-box">
                <div className="report-sign-title">مراجعة واعتماد</div>
                <div className="report-sign-line">الاسم / التوقيع / الختم</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
