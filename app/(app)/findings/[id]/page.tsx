import Link from "next/link";
import {
  Boxes,
  Building2,
  ClipboardList,
  FileWarning,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  EmptyPanel,
  ListRow,
  MetricCard,
  PageHero,
  SectionCard,
  SoftBadge,
} from "@/components/admin-page-kit";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import {
  isOpenFindingStatus,
  safeText,
  toFindingSeverityLabel,
  toSummaryResultLabel,
  toSystemLabel,
  toVisitStatusLabel,
  toVisitTypeLabel,
} from "@/lib/display";

function severityTone(value: any) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return "red" as const;
  if (v === "major") return "amber" as const;
  return "slate" as const;
}

function findingStatusLabel(value: any) {
  const open = isOpenFindingStatus(value);
  return open ? "مفتوحة" : "مغلقة";
}

function findingStatusTone(value: any) {
  const open = isOpenFindingStatus(value);
  return open ? ("amber" as const) : ("teal" as const);
}

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("findings", "view");
  const workbookId = actor.workbookId;

  const [
    findings,
    visits,
    visitSystems,
    facilities,
    buildings,
    assets,
    responses,
    evidence,
  ] = await Promise.all([
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "RESPONSES"),
    readSheet(workbookId, "EVIDENCE"),
  ]);

  const finding = findings.find(
    (row: any) => String(row.finding_id || "") === String(id)
  );

  if (!finding) {
    return (
      <AppShell>
        <SectionCard
          title="تفاصيل المخالفة"
          subtitle="تعذر العثور على المخالفة المطلوبة"
        >
          <EmptyPanel
            title="المخالفة غير موجودة"
            description="قد يكون الرابط غير صحيح أو تم حذف المخالفة."
          />
        </SectionCard>
      </AppShell>
    );
  }

  const visitSystem = visitSystems.find(
    (row: any) =>
      String(row.visit_system_id || "") === String(finding.visit_system_id || "")
  );

  const visit = visits.find(
    (row: any) => String(row.visit_id || "") === String(visitSystem?.visit_id || "")
  );

  const facility = facilities.find(
    (row: any) =>
      String(row.facility_id || "") === String(visit?.facility_id || "")
  );

  const building = buildings.find(
    (row: any) =>
      String(row.building_id || "") === String(visit?.building_id || "")
  );

  const asset = assets.find(
    (row: any) => String(row.asset_id || "") === String(finding.asset_id || "")
  );

  const response = responses.find(
    (row: any) => String(row.response_id || "") === String(finding.response_id || "")
  );

  const linkedEvidence = evidence.filter(
    (row: any) => String(row.finding_id || "") === String(finding.finding_id || "")
  );

  const systemCode =
    String(asset?.system_code || "") ||
    String(visitSystem?.system_code || "") ||
    "";

  const openStatus = isOpenFindingStatus(
    finding.closure_status || finding.compliance_status || ""
  );

  return (
    <AppShell>
      <PageHero
        eyebrow="تفاصيل المخالفة والإجراء التصحيحي والارتباطات"
        title={safeText(finding.title, "مخالفة")}
        subtitle={`${safeText(
          facility?.facility_name,
          "منشأة غير محددة"
        )}${building ? ` · ${safeText(building.building_name, "-")}` : ""}${
          systemCode ? ` · ${toSystemLabel(systemCode)}` : ""
        }`}
        icon={FileWarning}
        pills={[
          toFindingSeverityLabel(finding.severity),
          findingStatusLabel(finding.closure_status || finding.compliance_status),
        ]}
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
          label="الحالة"
          value={openStatus ? "1" : "0"}
          hint={openStatus ? "المخالفة مفتوحة" : "المخالفة مغلقة"}
          icon={ShieldAlert}
          tone={openStatus ? "amber" : "teal"}
        />
        <MetricCard
          label="الأدلة"
          value={linkedEvidence.length}
          hint="صور أو مرفقات مرتبطة"
          icon={FileWarning}
          tone="slate"
        />
        <MetricCard
          label="مرتبطة بأصل"
          value={asset ? "1" : "0"}
          hint={asset ? "يوجد أصل مرتبط" : "لا يوجد أصل مرتبط"}
          icon={Boxes}
          tone={asset ? "teal" : "slate"}
        />
        <MetricCard
          label="مرتبطة بزيارة"
          value={visit ? "1" : "0"}
          hint={visit ? "يوجد سجل زيارة مرتبط" : "لا يوجد سجل زيارة"}
          icon={ClipboardList}
          tone={visit ? "teal" : "slate"}
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="ملخص المخالفة"
          subtitle="الوصف والشدة والإجراء التصحيحي"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>رمز المخالفة</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {safeText(finding.finding_code, "-")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الشدة</div>
              <div style={{ marginTop: "8px" }}>
                <SoftBadge
                  label={toFindingSeverityLabel(finding.severity)}
                  tone={severityTone(finding.severity)}
                />
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الحالة</div>
              <div style={{ marginTop: "8px" }}>
                <SoftBadge
                  label={findingStatusLabel(
                    finding.closure_status || finding.compliance_status
                  )}
                  tone={findingStatusTone(
                    finding.closure_status || finding.compliance_status
                  )}
                />
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>النظام</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.6,
                }}
              >
                {systemCode ? toSystemLabel(systemCode) : "غير محدد"}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "14px", marginTop: "10px" }}>
            <div style={{ fontSize: "13px", color: "#64748b" }}>الوصف</div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "14px",
                color: "#334155",
                lineHeight: 1.8,
              }}
            >
              {safeText(finding.description, "لا يوجد وصف مسجل")}
            </div>
          </div>

          <div className="card" style={{ padding: "14px", marginTop: "10px" }}>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              الإجراء التصحيحي
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "14px",
                color: "#334155",
                lineHeight: 1.8,
              }}
            >
              {safeText(finding.corrective_action, "لا يوجد إجراء تصحيحي مسجل")}
            </div>
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="الارتباطات"
          subtitle="الزيارة والأصل والاستجابة التي أنشأت هذه المخالفة"
        >
          <div style={{ display: "grid", gap: "10px" }}>
            {visit ? (
              <ListRow
                href={`/visits/${String(visit.visit_id || "")}`}
                title={toVisitTypeLabel(visit.visit_type)}
                subtitle={`${safeText(
                  facility?.facility_name,
                  "منشأة غير محددة"
                )}${building ? ` · ${safeText(building.building_name, "-")}` : ""} · ${
                  visit.planned_date || visit.visit_date || "-"
                }`}
                rightBadge={
                  <SoftBadge
                    label={toVisitStatusLabel(visit.visit_status)}
                    tone={
                      String(visit.visit_status || "").toLowerCase() === "closed" ||
                      String(visit.visit_status || "").toLowerCase() === "completed"
                        ? "teal"
                        : "slate"
                    }
                  />
                }
              />
            ) : (
              <EmptyPanel
                title="لا توجد زيارة مرتبطة"
                description="لم يتم العثور على سجل زيارة مرتبط بهذه المخالفة."
              />
            )}

            {asset ? (
              <ListRow
                href={`/assets/${String(asset.asset_id || "")}`}
                title={safeText(asset.asset_name_ar || asset.asset_name, "أصل")}
                subtitle={`${toSystemLabel(asset.system_code)} · ${safeText(
                  asset.location_note,
                  "بدون موقع محدد"
                )}`}
                rightBadge={
                  <SoftBadge
                    label={safeText(asset.asset_code || asset.asset_id, "-")}
                    tone="slate"
                  />
                }
              />
            ) : (
              <EmptyPanel
                title="لا يوجد أصل مرتبط"
                description="المخالفة غير مرتبطة بأصل محدد."
              />
            )}

            {response ? (
              <div className="card" style={{ padding: "14px" }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.5,
                  }}
                >
                  الاستجابة المرتبطة
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  النتيجة: {safeText(response.response_value, "-")} · الوقت:{" "}
                  {safeText(response.response_at || response.updated_at, "-")}
                </div>
                {response.comments ? (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#334155",
                      lineHeight: 1.7,
                    }}
                  >
                    {String(response.comments)}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyPanel
                title="لا توجد استجابة مرتبطة"
                description="لم يتم العثور على سجل استجابة مباشر لهذه المخالفة."
              />
            )}
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="الإغلاق والتحقق"
          subtitle="بيانات الإغلاق الفعلية وملاحظات التحقق"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                تاريخ الإغلاق الفعلي
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {safeText(finding.actual_close_date, "غير مغلقة")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                الجهة المسؤولة
              </div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {safeText(finding.responsible_party, "غير محددة")}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "14px", marginTop: "10px" }}>
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              ملاحظات التحقق
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "14px",
                color: "#334155",
                lineHeight: 1.8,
              }}
            >
              {safeText(finding.verification_notes, "لا توجد ملاحظات تحقق")}
            </div>
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="الأدلة المرتبطة"
          subtitle="المرفقات أو الصور المرتبطة بهذه المخالفة"
        >
          {linkedEvidence.length === 0 ? (
            <EmptyPanel
              title="لا توجد أدلة"
              description="لم يتم ربط أدلة بهذه المخالفة بعد."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {linkedEvidence.map((row: any) => (
                <div
                  key={String(row.evidence_id || "")}
                  className="card"
                  style={{ padding: "14px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.5,
                        }}
                      >
                        {safeText(row.file_name || row.evidence_type, "Evidence")}
                      </div>

                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "13px",
                          color: "#64748b",
                          lineHeight: 1.7,
                        }}
                      >
                        {safeText(row.caption, "بدون وصف")} ·{" "}
                        {safeText(row.taken_at || row.updated_at, "-")}
                      </div>
                    </div>

                    <SoftBadge
                      label={safeText(row.evidence_type, "evidence")}
                      tone="slate"
                    />
                  </div>

                  {row.file_url ? (
                    <div style={{ marginTop: "10px" }}>
                      <a
                        href={String(row.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#0f766e",
                          textDecoration: "none",
                        }}
                      >
                        فتح الملف
                      </a>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
