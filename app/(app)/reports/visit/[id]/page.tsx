import Link from "next/link";
import { ArrowRight, ClipboardList, Printer } from "lucide-react";
import PrintReportButton from "@/components/print-report-button";
import { SeverityBadge } from "@/components/severity-badge";
import { FindingStatusBadge } from "@/components/finding-status-badge";
import { ReportDecisionBadge } from "@/components/report-decision-badge";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function safeText(value: any, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatDateLabel(value: any) {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text;
}

function toArabicSummary(value: string) {
  const normalized = String(value || "").toLowerCase();

  if (normalized === "compliant") return "مطابق";
  if (normalized === "pass_with_remarks") return "مطابق مع ملاحظات";
  if (normalized === "fail_critical") return "غير مطابق - حرج";
  if (normalized === "pending") return "قيد الانتظار";
  if (normalized === "non_compliant") return "غير مطابق";
  if (normalized === "critical_findings") return "مخالفات حرجة";

  return value || "غير محدد";
}

function toVisitTypeLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    followup: "متابعة (Follow-up)",
    asset_followup: "متابعة أصل (Asset Follow-up)",
    handover: "تسليم واستلام (Handover)",
    safety_inspection: "فحص سلامة (Safety Inspection)",
    periodic_inspection: "تفتيش دوري (Periodic Inspection)",
    initial_survey: "معاينة أولية (Initial Survey)",
    emergency_maintenance: "صيانة طارئة (Emergency Maintenance)",
    quality_audit: "تدقيق جودة (Quality Audit)",
    inspection: "تفتيش (Inspection)",
    audit: "تدقيق (Audit)",
  };

  return map[v] || safeText(value, "زيارة");
}

function toSystemLabel(value: any) {
  const raw = String(value || "").trim();
  const key = raw.toUpperCase().replace(/-/g, "_");

  const map: Record<string, string> = {
    FP_DIESEL_PUMP: "مضخة حريق ديزل (Fire Pump - Diesel)",
    FP_ELECTRIC_PUMP: "مضخة حريق كهربائية (Fire Pump - Electric)",
    JOCKEY_PUMP: "مضخة جوكي (Jockey Pump)",
    FIRE_ALARM: "نظام إنذار الحريق (Fire Alarm)",
    FA_ADDR: "إنذار حريق معنّون (Addressable Fire Alarm)",
    FA_VOICE: "إنذار صوتي وإخلاء (Voice Evacuation)",
    SP_WET: "شبكة رش آلي مائية (Wet Sprinkler System)",
    SP_DRY: "شبكة رش آلي جافة (Dry Sprinkler System)",
    HOSE_REEL: "بكرات خراطيم الحريق (Hose Reel)",
    FIRE_EXTINGUISHER: "طفايات الحريق (Fire Extinguishers)",
    EMERGENCY_LIGHT: "إنارة الطوارئ (Emergency Light)",
    EXIT_SIGN: "لوحات مخارج الطوارئ (Exit Sign)",
    FIRE_DOOR: "أبواب مقاومة للحريق (Fire Door)",
    CLEAN_AGENT: "نظام غاز نظيف (Clean Agent System)",
    FM200: "نظام FM200 (FM200 System)",
    CO2_SYSTEM: "نظام ثاني أكسيد الكربون (CO2 System)",
    FOAM_SYSTEM: "نظام رغوي (Foam System)",
    KITCHEN_SUPPRESSION: "إطفاء المطابخ (Kitchen Suppression)",
    FIRE_PUMP: "مضخة حريق (Fire Pump)",
  };

  return map[key] || raw || "-";
}

function makeReportReference(visitId: string, plannedDate: string) {
  const year = String(plannedDate || "").slice(0, 4) || "0000";
  return `SIR-${year}-${String(visitId).slice(-6)}`;
}

function looksLikeImage(url: string, evidenceType: string) {
  const u = String(url || "").toLowerCase();
  if (String(evidenceType || "").toLowerCase() === "image") return true;

  return (
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".png") ||
    u.endsWith(".webp") ||
    u.includes("blob.vercel-storage.com")
  );
}

function StatMiniCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "22px",
        background: "#ffffff",
        padding: "16px",
      }}
    >
      <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 700 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "38px",
          lineHeight: 1,
          fontWeight: 800,
          color: "#0f172a",
          marginTop: "8px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "10px" }}>
        {hint}
      </div>
    </div>
  );
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
    evidence,
    assets,
  ] = await Promise.all([
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "RESPONSES"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "TENANT_PROFILE"),
    readSheet(workbookId, "EVIDENCE"),
    readSheet(workbookId, "ASSETS"),
  ]);

  const visit = visits.find((v) => String(v.visit_id) === String(id));

  const systems = visitSystems.filter(
    (vs) => String(vs.visit_id) === String(id)
  );

  const visitSystemIds = new Set(systems.map((s) => String(s.visit_system_id)));

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

  const evidenceByFindingId = new Map<string, any[]>();

  for (const row of evidence) {
    const findingId = String(row.finding_id || "");
    if (!findingId) continue;

    if (!evidenceByFindingId.has(findingId)) {
      evidenceByFindingId.set(findingId, []);
    }

    evidenceByFindingId.get(findingId)?.push(row);
  }

  const assetById = new Map<string, any>();
  for (const row of assets) {
    assetById.set(String(row.asset_id || ""), row);
  }

  return (
    <div
      dir="rtl"
      style={{
        background: "#f1f5f9",
        minHeight: "100vh",
        padding: "16px 12px 40px",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              .print-hidden { display: none !important; }
              body { background: #ffffff !important; }
            }
          `,
        }}
      />

      <div style={{ margin: "0 auto", maxWidth: "980px" }}>
        <div
          className="print-hidden"
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/reports" className="btn btn-secondary">
              <ArrowRight size={18} />
              العودة للتقارير
            </Link>

            <Link href={`/visits/${id}`} className="btn btn-secondary">
              <ClipboardList size={18} />
              فتح الزيارة
            </Link>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div className="btn btn-secondary" style={{ pointerEvents: "none", opacity: 0.8 }}>
              <Printer size={18} />
              صفحة التقرير
            </div>
            <PrintReportButton />
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "28px",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ padding: "22px 18px 18px" }}>
            <div
              style={{
                display: "flex",
                gap: "14px",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "22px",
                    border: "1px solid #ccfbf1",
                    background: "#ecfeff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="logo"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 800,
                        color: "#0f766e",
                      }}
                    >
                      {brandFallback}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>{brandSub}</div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#0f172a",
                      marginTop: "4px",
                    }}
                  >
                    {brandName}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "6px" }}>
                    {safeText(tenantProfile.address_line, "")}
                    {tenantProfile.city ? ` · ${tenantProfile.city}` : ""}
                    {tenantProfile.country ? ` · ${tenantProfile.country}` : ""}
                  </div>
                </div>
              </div>

              <div style={{ minWidth: "220px" }}>
                <div style={{ fontSize: "13px", color: "#64748b" }}>قرار التقرير</div>
                <div style={{ marginTop: "8px" }}>
                  <ReportDecisionBadge
                    value={String(visit?.summary_result || "pending")}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "18px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#64748b" }}>تقرير زيارة تفتيش فني</div>
              <div
                style={{
                  fontSize: "34px",
                  lineHeight: 1.15,
                  fontWeight: 900,
                  color: "#0f172a",
                  marginTop: "8px",
                }}
              >
                تقرير زيارة {safeText(facility?.facility_name || facility?.facility_name_ar, "المنشأة")}
              </div>

              <div
                style={{
                  fontSize: "15px",
                  color: "#475569",
                  marginTop: "10px",
                  lineHeight: 1.9,
                }}
              >
                تقرير فني عربي قابل للطباعة والحفظ PDF، مبني على نتائج الزيارة
                والأنظمة والمخالفات المسجلة داخل المنصة.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "14px",
                }}
              >
                <span className="badge">رقم التقرير: {reportRef}</span>
                <span className="badge">رقم الزيارة: {String(id)}</span>
                <span className="badge">
                  التاريخ: {formatDateLabel(visit?.planned_date || visit?.visit_date)}
                </span>
                <span className="badge">
                  نوع الزيارة: {toVisitTypeLabel(visit?.visit_type)}
                </span>
                <span className="badge">
                  المبنى: {safeText(building?.building_name, "غير محدد")}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 18px 22px" }}>
            <section
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                background: "#f8fafc",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                البيانات الأساسية
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                لقطة سريعة عن المنشأة والزيارة وحالة التقرير
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                <StatMiniCard
                  label="المنشأة"
                  value={safeText(facility?.facility_name || facility?.facility_name_ar)}
                  hint={safeText(building?.building_name, "بدون مبنى محدد")}
                />
                <StatMiniCard
                  label="نسبة الامتثال"
                  value={`${overallCompliance}%`}
                  hint="البنود القابلة للتقييم فقط"
                />
                <StatMiniCard
                  label="البنود المطابقة"
                  value={compliantCount}
                  hint="إجمالي البنود المطابقة"
                />
                <StatMiniCard
                  label="البنود غير المطابقة"
                  value={nonCompliantCount}
                  hint="إجمالي البنود غير المطابقة"
                />
                <StatMiniCard
                  label="المخالفات"
                  value={visitFindings.length}
                  hint="ناتجة عن هذه الزيارة"
                />
                <StatMiniCard
                  label="الاستحقاق التالي"
                  value={safeText(visit?.next_due_date)}
                  hint="الموعد المتوقع التالي"
                />
              </div>

              <div
                style={{
                  marginTop: "14px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span className="badge">غير منطبق: {notApplicableCount}</span>
                <span className="badge">حرج: {criticalCount}</span>
                <span className="badge">مرتفع: {majorCount}</span>
                <span className="badge">منخفض: {minorCount}</span>
                <span className="badge">
                  النتيجة العامة: {toArabicSummary(String(visit?.summary_result || "pending"))}
                </span>
              </div>
            </section>

            <section
              style={{
                marginTop: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                background: "#ffffff",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                نطاق الفحص ومنهجية العمل
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                وصف مختصر لنطاق الزيارة وكيفية تسجيل النتائج داخل النظام
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "14px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>نطاق الفحص</div>
                  <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.9, marginTop: "8px" }}>
                    شمل الفحص الأنظمة المرتبطة بهذه الزيارة كما هي مسجلة داخل المنصة،
                    وتم تقييم البنود وفق قائمة الفحص المرتبطة بكل نظام.
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "14px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>منهجية التقييم</div>
                  <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.9, marginTop: "8px" }}>
                    تم تسجيل البنود كالتالي: مطابق، غير مطابق، أو غير منطبق، مع
                    احتساب نسبة الامتثال بناءً على البنود القابلة للتقييم فقط.
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "14px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>مخرجات الفحص</div>
                  <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.9, marginTop: "8px" }}>
                    تم إنشاء المخالفات تلقائيًا للبنود غير المطابقة، وربطها بالإجراءات
                    التصحيحية وحالة الإغلاق عند توفرها.
                  </div>
                </div>
              </div>
            </section>

            <section
              style={{
                marginTop: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                background: "#ffffff",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                الأنظمة المشمولة بالفحص
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                ملخص نتائج الأنظمة المشمولة بهذه الزيارة
              </div>

              {systems.length === 0 ? (
                <div
                  style={{
                    marginTop: "16px",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "18px",
                    padding: "16px",
                    color: "#64748b",
                    background: "#f8fafc",
                  }}
                >
                  لا توجد أنظمة مرتبطة بهذه الزيارة.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "12px",
                    marginTop: "16px",
                  }}
                >
                  {systems.map((system) => (
                    <div
                      key={String(system.visit_system_id)}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "18px",
                        background: "#f8fafc",
                        padding: "14px",
                      }}
                    >
                      <div style={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.7 }}>
                        {toSystemLabel(system.system_code)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "10px",
                        }}
                      >
                        <span className="badge">
                          الحالة: {safeText(system.status)}
                        </span>
                        <span className="badge">
                          النتيجة: {toArabicSummary(String(system.result_summary || "pending"))}
                        </span>
                        <span className="badge">
                          الامتثال: {safeText(system.compliance_percent, "0")}%
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          gap: "8px",
                          marginTop: "12px",
                        }}
                      >
                        <div
                          style={{
                            borderRadius: "14px",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            padding: "10px",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "12px", color: "#64748b" }}>حرج</div>
                          <div style={{ fontSize: "22px", fontWeight: 800 }}>{safeText(system.critical_count, "0")}</div>
                        </div>
                        <div
                          style={{
                            borderRadius: "14px",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            padding: "10px",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "12px", color: "#64748b" }}>مرتفع</div>
                          <div style={{ fontSize: "22px", fontWeight: 800 }}>{safeText(system.major_count, "0")}</div>
                        </div>
                        <div
                          style={{
                            borderRadius: "14px",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            padding: "10px",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "12px", color: "#64748b" }}>منخفض</div>
                          <div style={{ fontSize: "22px", fontWeight: 800 }}>{safeText(system.minor_count, "0")}</div>
                        </div>
                        <div
                          style={{
                            borderRadius: "14px",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            padding: "10px",
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: "12px", color: "#64748b" }}>التالي</div>
                          <div style={{ fontSize: "13px", fontWeight: 800 }}>
                            {safeText(system.next_due_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section
              style={{
                marginTop: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                background: "#ffffff",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                المخالفات والملاحظات التصحيحية
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                جميع البنود غير المطابقة الناتجة عن هذه الزيارة
              </div>

              {visitFindings.length === 0 ? (
                <div
                  style={{
                    marginTop: "16px",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "18px",
                    padding: "16px",
                    color: "#64748b",
                    background: "#f8fafc",
                  }}
                >
                  لا توجد مخالفات مسجلة ضمن هذه الزيارة.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
                  {visitFindings.map((finding) => {
                    const findingEvidence =
                      evidenceByFindingId.get(String(finding.finding_id || "")) || [];

                    const relatedAsset = assetById.get(String(finding.asset_id || ""));

                    return (
                      <div
                        key={String(finding.finding_id)}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "20px",
                          background: "#f8fafc",
                          padding: "16px",
                        }}
                      >
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                          {safeText(finding.title, "مخالفة")}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "10px",
                          }}
                        >
                          <SeverityBadge severity={String(finding.severity || "")} />
                          <FindingStatusBadge
                            status={String(
                              finding.closure_status ||
                                finding.compliance_status ||
                                "open"
                            )}
                          />
                          <span className="badge">
                            الكود: {safeText(finding.finding_code)}
                          </span>
                        </div>

                        {relatedAsset ? (
                          <div style={{ marginTop: "10px" }}>
                            <span className="badge">
                              الأصل المرتبط:{" "}
                              {safeText(
                                relatedAsset.asset_name_ar ||
                                  relatedAsset.asset_name ||
                                  relatedAsset.asset_code ||
                                  relatedAsset.asset_id
                              )}
                            </span>
                          </div>
                        ) : null}

                        <div
                          style={{
                            fontSize: "15px",
                            color: "#334155",
                            lineHeight: 1.9,
                            marginTop: "12px",
                          }}
                        >
                          {safeText(finding.description, "لا يوجد وصف")}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          <div className="badge">
                            الإجراء التصحيحي: {safeText(finding.corrective_action, "غير مسجل")}
                          </div>
                          <div className="badge">
                            المسؤول: {safeText(finding.responsible_party, "غير محدد")}
                          </div>
                          <div className="badge">
                            الإغلاق المستهدف: {safeText(finding.target_close_date)}
                          </div>
                          <div className="badge">
                            الإغلاق الفعلي: {safeText(finding.actual_close_date)}
                          </div>
                        </div>

                        {findingEvidence.length > 0 ? (
                          <div style={{ marginTop: "14px" }}>
                            <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 700 }}>
                              الأدلة المرتبطة بهذه المخالفة
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gap: "12px",
                                marginTop: "12px",
                              }}
                            >
                              {findingEvidence.map((ev: any) => (
                                <div
                                  key={String(ev.evidence_id)}
                                  style={{
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "16px",
                                    padding: "12px",
                                    background: "#fff",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "8px",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span className="badge">
                                      {safeText(ev.evidence_type, "evidence")}
                                    </span>
                                    {ev.file_name ? (
                                      <span className="badge">{String(ev.file_name)}</span>
                                    ) : null}
                                  </div>

                                  {looksLikeImage(
                                    String(ev.file_url || ""),
                                    String(ev.evidence_type || "")
                                  ) ? (
                                    <div style={{ marginTop: "12px" }}>
                                      <img
                                        src={String(ev.file_url || "")}
                                        alt={String(ev.file_name || "Evidence")}
                                        style={{
                                          width: "100%",
                                          maxHeight: "360px",
                                          objectFit: "contain",
                                          borderRadius: "12px",
                                          border: "1px solid #e2e8f0",
                                          background: "#fff",
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        marginTop: "12px",
                                        border: "1px dashed #cbd5e1",
                                        borderRadius: "14px",
                                        padding: "12px",
                                        color: "#64748b",
                                        background: "#f8fafc",
                                      }}
                                    >
                                      مرفق غير صوري: {safeText(ev.file_name, "ملف")}
                                    </div>
                                  )}

                                  {ev.caption ? (
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: "#334155",
                                        lineHeight: 1.8,
                                        marginTop: "10px",
                                      }}
                                    >
                                      {String(ev.caption)}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section
              style={{
                marginTop: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                background: "#ffffff",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                توصيات فنية عامة
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                توصيات مبنية على نتائج الزيارة الحالية
              </div>

              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                {generalRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "18px",
                      padding: "14px",
                      background: "#f8fafc",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      توصية {index + 1}
                    </div>
                    <div
                      style={{
                        color: "#475569",
                        fontSize: "14px",
                        lineHeight: 1.9,
                        marginTop: "8px",
                      }}
                    >
                      {rec}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                marginTop: "16px",
                border: "1px solid #e2e8f0",
                borderRadius: "24px",
                background: "#ffffff",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                حدود التقرير واعتماد المفتش
              </div>
              <div style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
                ملاحظات تنظيمية وإدارية خاصة بالتقرير
              </div>

              <div
                style={{
                  marginTop: "16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "14px",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "14px",
                  lineHeight: 1.9,
                }}
              >
                تم إعداد هذا التقرير اعتمادًا على البيانات المدخلة في المنصة خلال
                الزيارة الحالية، ويعكس نتائج البنود والأنظمة المشمولة فقط ضمن نطاق
                الزيارة المسجلة. لا يمثل هذا التقرير اعتمادًا نهائيًا إلا بعد المراجعة
                الداخلية والتوقيع النظامي من الجهة المخولة.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "14px",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>إعداد التقرير</div>
                  <div style={{ color: "#475569", marginTop: "14px" }}>
                    {signatoryName} {signatoryTitle ? `· ${signatoryTitle}` : ""}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "14px",
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a" }}>مراجعة واعتماد</div>
                  <div style={{ color: "#475569", marginTop: "14px" }}>{stampNote}</div>
                </div>
              </div>
            </section>

            <div
              style={{
                marginTop: "18px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {footerNote}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
