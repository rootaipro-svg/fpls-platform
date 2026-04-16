import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
} from "lucide-react";
import PrintReportButton from "@/components/print-report-button";
import { SeverityBadge } from "@/components/severity-badge";
import { FindingStatusBadge } from "@/components/finding-status-badge";
import { ReportDecisionBadge } from "@/components/report-decision-badge";
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

function makeReportReference(visitId: string, plannedDate: string) {
  const year = String(plannedDate || "").slice(0, 4) || "0000";
  return `SIR-${year}-${String(visitId).slice(-6)}`;
}

export default async function VisitReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [
    visits,
    visitSystems,
    responses,
    findings,
    facilities,
    buildings,
    tenantProfiles,
  ] = await Promise.all([
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "RESPONSES"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "TENANT_PROFILE"),
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

  const tenantProfile =
    tenantProfiles.find((r) => String(r.tenant_id) === String(user.tenantId)) ||
    {};

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

  const reportRef = makeReportReference(
    String(id),
    String(visit?.planned_date || visit?.visit_date || "")
  );

  const criticalCount = visitFindings.filter(
    (f) => String(f.severity || "").toLowerCase() === "critical"
  ).length;

  const majorCount = visitFindings.filter(
    (f) => String(f.severity || "").toLowerCase() === "major"
  ).length;

  const minorCount = visitFindings.filter(
    (f) => String(f.severity || "").toLowerCase() === "minor"
  ).length;

  const generalRecommendations: string[] = [];

  if (criticalCount > 0) {
    generalRecommendations.push(
      "معالجة جميع المخالفات الحرجة فورًا قبل اعتبار الأنظمة في وضع تشغيلي مقبول."
    );
  }

  if (majorCount > 0) {
    generalRecommendations.push(
      "وضع خطة تصحيحية زمنية واضحة للمخالفات المرتفعة مع تحديد المسؤول وتاريخ الإغلاق."
    );
  }

  if (minorCount > 0) {
    generalRecommendations.push(
      "استكمال الملاحظات المنخفضة ضمن أعمال التحسين الوقائي والصيانة الروتينية."
    );
  }

  if (generalRecommendations.length === 0) {
    generalRecommendations.push(
      "الاستمرار في الصيانة الدورية وتوثيق نتائج الفحص للحفاظ على مستوى الامتثال الحالي."
    );
  }

  const brandName =
    String(tenantProfile.report_brand_name || "") ||
    String(tenantProfile.company_name_ar || "") ||
    "FPLS Inspection Platform";

  const brandSub =
    String(tenantProfile.company_name_en || "") ||
    "Fire Protection & Life Safety";

  const logoUrl = String(tenantProfile.logo_url || "");
  const brandFallback = brandName.trim().slice(0, 2).toUpperCase();

  const footerNote =
    String(tenantProfile.report_footer_note || "") ||
    "تم إنشاء هذا التقرير من خلال منصة FPLS Inspection Platform";

  const signatoryName =
    String(tenantProfile.authorized_signatory_name || "") || "الاسم / التوقيع";

  const signatoryTitle =
    String(tenantProfile.authorized_signatory_title || "") || "المسمى الوظيفي";

  const stampNote =
    String(tenantProfile.stamp_note || "") ||
    "الختم النظامي / الاعتماد الداخلي";

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
          <div className="report-brand-row">
            <div className="report-logo-box">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" />
              ) : (
                <span className="report-logo-fallback">{brandFallback}</span>
              )}
            </div>

            <div className="report-brand-content">
              <div className="report-cover-eyebrow">{brandSub}</div>
              <div className="report-brand-name">{brandName}</div>
              <div className="report-brand-sub">
                {String(tenantProfile.address_line || "")}
                {tenantProfile.city ? ` · ${tenantProfile.city}` : ""}
                {tenantProfile.country ? ` · ${tenantProfile.country}` : ""}
              </div>

              <div className="report-brand-contact">
                {tenantProfile.contact_phone ? (
                  <span className="badge">
                    {String(tenantProfile.contact_phone)}
                  </span>
                ) : null}
                {tenantProfile.contact_email ? (
                  <span className="badge">
                    {String(tenantProfile.contact_email)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="report-cover-title">تقرير زيارة تفتيش فني</div>

          <div className="report-cover-subtitle">
            تقرير فني عربي قابل للطباعة والحفظ PDF، مبني على نتائج الزيارة والأنظمة
            والمخالفات المسجلة داخل المنصة.
          </div>

          <div className="report-badge-row">
            <span className="badge">رقم التقرير: {reportRef}</span>
            <span className="badge">رقم الزيارة: {String(id)}</span>
            <span className="badge">
              التاريخ: {String(visit?.planned_date || visit?.visit_date || "-")}
            </span>
            <span className="badge">
              نوع الزيارة: {String(visit?.visit_type || "-")}
            </span>
          </div>

          <div style={{ marginTop: "14px" }}>
            <ReportDecisionBadge
              value={String(visit?.summary_result || "pending")}
            />
          </div>
        </div>

        <div className="report-content">
          <section className="report-section">
            <div className="report-section-title">نطاق الفحص ومنهجية العمل</div>
            <div className="report-section-subtitle">
              وصف مختصر لنطاق الزيارة وكيفية تسجيل النتائج داخل النظام
            </div>

            <div className="report-scope-list">
              <div className="report-scope-item">
                <div className="report-scope-item-title">نطاق الفحص</div>
                <div className="report-scope-item-text">
                  شمل الفحص الأنظمة المرتبطة بهذه الزيارة كما هي مسجلة داخل المنصة،
                  وتم تقييم البنود وفق قائمة الفحص المرتبطة بكل نظام.
                </div>
              </div>

              <div className="report-scope-item">
                <div className="report-scope-item-title">منهجية التقييم</div>
                <div className="report-scope-item-text">
                  تم تسجيل البنود كالتالي: مطابق، غير مطابق، أو غير منطبق، مع
                  احتساب نسبة الامتثال بناءً على البنود القابلة للتقييم فقط.
                </div>
              </div>

              <div className="report-scope-item">
                <div className="report-scope-item-title">مخرجات الفحص</div>
                <div className="report-scope-item-text">
                  تم إنشاء المخالفات تلقائيًا للبنود غير المطابقة، وربطها بالإجراءات
                  التصحيحية وحالة الإغلاق عند توفرها.
                </div>
              </div>
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-title">ملخص الامتثال العام</div>
            <div className="report-section-subtitle">
              قراءة سريعة لحالة الزيارة ونتائجها النهائية
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

            <div className="report-highlight-grid">
              <div className="report-highlight-card">
                <div className="report-highlight-value">{compliantCount}</div>
                <div className="report-highlight-label">بنود مطابقة</div>
              </div>

              <div className="report-highlight-card">
                <div className="report-highlight-value">{nonCompliantCount}</div>
                <div className="report-highlight-label">بنود غير مطابقة</div>
              </div>

              <div className="report-highlight-card">
                <div className="report-highlight-value">{visitFindings.length}</div>
                <div className="report-highlight-label">عدد المخالفات</div>
              </div>
            </div>

            <div className="report-badge-row">
              <span className="badge">غير منطبق: {notApplicableCount}</span>
              <span className="badge">حرج: {criticalCount}</span>
              <span className="badge">مرتفع: {majorCount}</span>
              <span className="badge">منخفض: {minorCount}</span>
              <span className="badge">
                الاستحقاق التالي: {String(visit?.next_due_date || "-")}
              </span>
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-title">الأنظمة المشمولة بالفحص</div>
            <div className="report-section-subtitle">
              ملخص نتائج الأنظمة المشمولة بهذه الزيارة
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
                        <td>
                          {toArabicSummary(
                            String(system.result_summary || "pending")
                          )}
                        </td>
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
            <div className="report-section-title">المخالفات والملاحظات التصحيحية</div>
            <div className="report-section-subtitle">
              جميع البنود غير المطابقة الناتجة عن هذه الزيارة
            </div>

            {visitFindings.length === 0 ? (
              <div className="report-note-box">
                لا توجد مخالفات مسجلة ضمن هذه الزيارة.
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
                      <span className="badge">
                        الإغلاق الفعلي: {String(finding.actual_close_date || "-")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="report-section">
            <div className="report-section-title">توصيات فنية عامة</div>
            <div className="report-section-subtitle">
              توصيات مبنية على نتائج الزيارة الحالية
            </div>

            <div className="report-recommendation-list">
              {generalRecommendations.map((rec, index) => (
                <div key={index} className="report-recommendation-item">
                  <div className="report-recommendation-title">
                    توصية {index + 1}
                  </div>
                  <div className="report-recommendation-text">{rec}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="report-section">
            <div className="report-section-title">حدود التقرير واعتماد المفتش</div>
            <div className="report-section-subtitle">
              ملاحظات تنظيمية وإدارية خاصة بالتقرير
            </div>

            <div className="report-note-box">
              تم إعداد هذا التقرير اعتمادًا على البيانات المدخلة في المنصة خلال
              الزيارة الحالية، ويعكس نتائج البنود والأنظمة المشمولة فقط ضمن نطاق
              الزيارة المسجلة. لا يمثل هذا التقرير اعتمادًا نهائيًا إلا بعد المراجعة
              الداخلية والتوقيع النظامي من الجهة المخولة.
            </div>

            <div className="report-signature-grid">
              <div className="report-sign-box">
                <div className="report-sign-title">إعداد التقرير</div>
                <div className="report-sign-line">
                  {signatoryName} {signatoryTitle ? `· ${signatoryTitle}` : ""}
                </div>
              </div>

              <div className="report-sign-box">
                <div className="report-sign-title">مراجعة واعتماد</div>
                <div className="report-sign-line">{stampNote}</div>
              </div>
            </div>
          </section>

          <div className="report-footer-note">{footerNote}</div>
        </div>
      </div>
    </div>
  );
}
