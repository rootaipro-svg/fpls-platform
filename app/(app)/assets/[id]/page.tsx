import Link from "next/link";
import CreateAssetVisitButton from "@/components/create-asset-visit-button";
import EditAssetForm from "@/components/edit-asset-form";
import {
  Boxes,
  ClipboardList,
  Clock3,
  FileImage,
  FileWarning,
  MapPin,
  QrCode,
  ShieldCheck,
  UserRound,
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
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";
import { readSheet } from "@/lib/sheets";
import {
  safeText,
  toSystemLabel,
  toVisitTypeLabel,
  toVisitStatusLabel,
  toFindingSeverityLabel,
  isOpenFindingStatus,
} from "@/lib/display";

function parseAllowedSystems(value: any) {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sortVisitsDesc(rows: any[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(
      String(a?.planned_date || a?.visit_date || a?.updated_at || 0)
    ).getTime();
    const bTime = new Date(
      String(b?.planned_date || b?.visit_date || b?.updated_at || 0)
    ).getTime();
    return bTime - aTime;
  });
}

function sortByStampDesc(rows: any[], ...fields: string[]) {
  return [...rows].sort((a, b) => {
    const aValue =
      fields.map((f) => String(a?.[f] || "")).find(Boolean) || "0";
    const bValue =
      fields.map((f) => String(b?.[f] || "")).find(Boolean) || "0";

    const aTime = new Date(aValue).getTime();
    const bTime = new Date(bValue).getTime();

    return bTime - aTime;
  });
}

function daysBetween(today: Date, target: Date) {
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getDueState(nextDueDate: string) {
  if (!nextDueDate) {
    return { label: "غير محدد", tone: "slate" as const };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(nextDueDate);
  if (Number.isNaN(due.getTime())) {
    return { label: "غير محدد", tone: "slate" as const };
  }

  due.setHours(0, 0, 0, 0);
  const diff = daysBetween(today, due);

  if (diff < 0) return { label: "متأخر", tone: "red" as const };
  if (diff === 0) return { label: "اليوم", tone: "amber" as const };
  if (diff <= 7) return { label: "قريب", tone: "teal" as const };
  return { label: "مستقبلي", tone: "slate" as const };
}

function responseLabel(value: any) {
  const v = String(value || "").trim().toLowerCase();

  const map: Record<string, string> = {
    compliant: "مطابق",
    non_compliant: "غير مطابق",
    not_applicable: "غير منطبق",
    pass: "ناجح",
    fail: "فاشل",
    check: "يحتاج مراجعة",
  };

  return map[v] || safeText(value);
}
type ActionCardProps = {
  href: string;
  title: string;
  icon?: any;
  subtitle?: string;
  description?: string;
  text?: string;
  hint?: string;
  badge?: string;
  tone?: "teal" | "amber" | "red" | "slate";
  disabled?: boolean;
  [key: string]: any;
};

function ActionCard({
  href,
  title,
  icon: Icon,
  subtitle,
  description,
  text,
  hint,
  badge,
  tone = "teal",
  disabled = false,
}: ActionCardProps) {
  const toneMap: Record<
    string,
    { bg: string; border: string; iconBg: string; iconColor: string }
  > = {
    teal: {
      bg: "#ffffff",
      border: "1px solid #e2e8f0",
      iconBg: "#ecfeff",
      iconColor: "#0f766e",
    },
    amber: {
      bg: "#ffffff",
      border: "1px solid #fde68a",
      iconBg: "#fffbeb",
      iconColor: "#b45309",
    },
    red: {
      bg: "#ffffff",
      border: "1px solid #fecaca",
      iconBg: "#fef2f2",
      iconColor: "#b91c1c",
    },
    slate: {
      bg: "#ffffff",
      border: "1px solid #e2e8f0",
      iconBg: "#f8fafc",
      iconColor: "#475569",
    },
  };

  const theme = toneMap[tone] || toneMap.teal;
  const bodyText = subtitle || description || text || hint || "";

  return (
    <Link
      href={disabled ? "#" : href}
      style={{
        display: "block",
        borderRadius: "24px",
        border: theme.border,
        background: theme.bg,
        padding: "16px",
        textDecoration: "none",
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1, textAlign: "right" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.5,
            }}
          >
            {title}
          </div>

          {bodyText ? (
            <div
              style={{
                marginTop: "8px",
                fontSize: "14px",
                color: "#64748b",
                lineHeight: 1.8,
              }}
            >
              {bodyText}
            </div>
          ) : null}

          {badge ? (
            <div
              style={{
                marginTop: "10px",
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "999px",
                border: "1px solid #e2e8f0",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#334155",
                background: "#f8fafc",
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>

        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "18px",
            background: theme.iconBg,
            color: theme.iconColor,
            border: "1px solid #dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {Icon ? <Icon size={24} /> : null}
        </div>
      </div>
    </Link>
  );
}
export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("facilities", "view");
  const workbookId = actor.workbookId;

  const [
    assets,
    facilities,
    buildings,
    visits,
    visitSystems,
    responses,
    findings,
    evidence,
  ] = await Promise.all([
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "RESPONSES"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "EVIDENCE"),
  ]);

  const asset = assets.find((row: any) => String(row.asset_id) === String(id));

  if (!asset) {
    return (
      <AppShell>
        <SectionCard
          title="تفاصيل الأصل"
          subtitle="تعذر العثور على الأصل المطلوب"
        >
          <EmptyPanel
            title="الأصل غير موجود"
            description="قد يكون الرابط غير صحيح أو تم حذف الأصل."
          />
        </SectionCard>
      </AppShell>
    );
  }

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(workbookId, actor)
      : null;

  if (actor.role === "inspector") {
    if (!currentInspector) {
      return (
        <AppShell>
          <SectionCard
            title="تفاصيل الأصل"
            subtitle="لا يوجد ملف مفتش مرتبط بهذا الحساب"
          >
            <EmptyPanel
              title="تعذر فتح الأصل"
              description="اربط هذا الحساب بسجل مفتش داخل INSPECTORS أولًا."
            />
          </SectionCard>
        </AppShell>
      );
    }

    const allowedSystems = parseAllowedSystems(currentInspector.allowed_systems);
    const canAccess =
      allowedSystems.includes("*") ||
      allowedSystems.includes(String(asset.system_code || ""));

    if (!canAccess) {
      return (
        <AppShell>
          <SectionCard title="تفاصيل الأصل" subtitle="غير مصرح">
            <EmptyPanel
              title="هذا الأصل غير مخول لك"
              description="يمكنك فقط الوصول إلى الأصول التابعة للأنظمة المصرح لك بها."
            />
          </SectionCard>
        </AppShell>
      );
    }
  }

  const facility = facilities.find(
    (row: any) => String(row.facility_id) === String(asset.facility_id || "")
  );

  const building = buildings.find(
    (row: any) => String(row.building_id) === String(asset.building_id || "")
  );

  const assetVisitSystems = visitSystems.filter(
    (row: any) =>
      String(row.building_system_id || "") ===
      String(asset.building_system_id || "")
  );

  const assetVisitIds = new Set(
    assetVisitSystems.map((row: any) => String(row.visit_id || ""))
  );

  const relatedVisits = sortVisitsDesc(
    visits.filter((row: any) => assetVisitIds.has(String(row.visit_id || "")))
  );

  const activeVisit =
    actor.role === "inspector" && currentInspector
      ? relatedVisits.find(
          (row: any) =>
            String(row.visit_status || "").toLowerCase() !== "closed" &&
            String(row.visit_status || "").toLowerCase() !== "completed" &&
            isVisitAssignedToInspector(row, String(currentInspector.inspector_id))
        )
      : relatedVisits.find(
          (row: any) =>
            String(row.visit_status || "").toLowerCase() !== "closed" &&
            String(row.visit_status || "").toLowerCase() !== "completed"
        );

  const assetResponses = sortByStampDesc(
    responses.filter((row: any) => String(row.asset_id || "") === String(id)),
    "response_at",
    "updated_at"
  );

  const assetFindings = sortByStampDesc(
    findings.filter((row: any) => String(row.asset_id || "") === String(id)),
    "updated_at",
    "created_at"
  );

  const assetEvidence = sortByStampDesc(
    evidence.filter((row: any) => String(row.asset_id || "") === String(id)),
    "taken_at",
    "updated_at",
    "created_at"
  );

  const compliantCount = assetResponses.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "compliant"
  ).length;

  const nonCompliantCount = assetResponses.filter(
    (r: any) => String(r.response_value || "").toLowerCase() === "non_compliant"
  ).length;

  const openFindingsCount = assetFindings.filter((f: any) =>
    isOpenFindingStatus(f.closure_status || f.compliance_status || "")
  ).length;

  const latestVisit = relatedVisits[0] || null;
  const latestResponse = assetResponses[0] || null;
  const latestFinding = assetFindings[0] || null;

  const dueState = getDueState(String(asset.next_due_date || ""));

  return (
    <AppShell>
      <PageHero
        eyebrow="تفاصيل الأصل والموقع والزيارات والنتائج المرتبطة به"
        title={safeText(asset.asset_name_ar || asset.asset_name, "أصل")}
        subtitle={`${toSystemLabel(asset.system_code)}${
          facility ? ` · ${safeText(facility.facility_name, "منشأة")}` : ""
        }${building ? ` · ${safeText(building.building_name, "مبنى")}` : ""}`}
        icon={Boxes}
        pills={[
          safeText(asset.asset_code || asset.asset_id, "بدون كود"),
          dueState.label,
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
          label="الزيارات"
          value={relatedVisits.length}
          hint="مرتبطة بهذا الأصل"
          icon={ClipboardList}
          tone="teal"
        />
        <MetricCard
          label="النتائج"
          value={assetResponses.length}
          hint="إجمالي بنود الفحص"
          icon={ShieldCheck}
          tone="slate"
        />
        <MetricCard
          label="المخالفات"
          value={openFindingsCount}
          hint="مفتوحة وتحتاج متابعة"
          icon={FileWarning}
          tone={openFindingsCount > 0 ? "red" : "slate"}
        />
        <MetricCard
          label="الأدلة"
          value={assetEvidence.length}
          hint="صور ومرفقات مرتبطة"
          icon={FileImage}
          tone="slate"
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="إجراءات سريعة"
          subtitle="الوصول المباشر لأهم ما يخص هذا الأصل"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <ActionCard
              href={`/assets/${id}/inspect`}
              title="بدء الفحص"
              icon={ClipboardList}
              tone="teal"
            />

            <ActionCard
              href={`/assets/${id}/qr`}
              title="عرض QR"
              icon={QrCode}
              tone="slate"
            />
          </div>

          <div style={{ marginTop: "12px" }}>
            {activeVisit ? (
              <Link
                href={`/visits/${String(activeVisit.visit_id)}?asset_id=${encodeURIComponent(
                  String(id)
                )}`}
                className="card"
                style={{
                  display: "block",
                  padding: "16px",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  فتح زيارة التنفيذ الحالية
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  {toVisitTypeLabel(activeVisit.visit_type)} ·{" "}
                  {toVisitStatusLabel(activeVisit.visit_status)}
                </div>
              </Link>
            ) : (
              <CreateAssetVisitButton
                assetId={String(id)}
                className="btn btn-secondary"
                label="لا توجد زيارة نشطة، أنشئ زيارة الآن"
              />
            )}
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="ملخص الأصل"
          subtitle="الموقع والبيانات الأساسية وحالة الاستحقاق"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
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
                {toSystemLabel(asset.system_code)}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الحالة</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {safeText(asset.status, "active")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>آخر فحص</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {safeText(asset.last_inspected_at, "غير مسجل")}
              </div>
            </div>

            <div className="card" style={{ padding: "14px" }}>
              <div style={{ fontSize: "13px", color: "#64748b" }}>الاستحقاق التالي</div>
              <div
                style={{
                  marginTop: "6px",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {safeText(asset.next_due_date, "غير مسجل")}
              </div>
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: "14px",
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <MapPin size={18} color="#64748b" />
            <div style={{ fontSize: "14px", color: "#334155", lineHeight: 1.7 }}>
              {safeText(asset.location_note, "بدون موقع محدد")}
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <SoftBadge label={dueState.label} tone={dueState.tone} />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="آخر النتائج"
          subtitle="آخر نتائج الفحص المسجلة لهذا الأصل"
        >
          {assetResponses.length === 0 ? (
            <EmptyPanel
              title="لا توجد نتائج"
              description="عند تنفيذ فحص لهذا الأصل ستظهر النتائج هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {assetResponses.slice(0, 6).map((row: any) => (
                <ListRow
                  key={String(row.response_id || "")}
                  href={`/visits/${String(row.visit_id || relatedVisits[0]?.visit_id || "")}`}
                  title={responseLabel(row.response_value)}
                  subtitle={safeText(row.comments, "بدون ملاحظات")}
                  rightBadge={
                    <SoftBadge
                      label={safeText(row.response_at || row.updated_at, "-")}
                      tone={
                        String(row.response_value || "").toLowerCase() ===
                        "non_compliant"
                          ? "amber"
                          : "teal"
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="المخالفات المرتبطة"
          subtitle="المخالفات الناتجة عن فحص هذا الأصل"
        >
          {assetFindings.length === 0 ? (
            <EmptyPanel
              title="لا توجد مخالفات"
              description="لم يتم تسجيل مخالفات على هذا الأصل بعد."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {assetFindings.slice(0, 6).map((finding: any) => (
                <ListRow
                  key={String(finding.finding_id || "")}
                  href={`/findings/${String(finding.finding_id || "")}`}
                  title={safeText(finding.title, "مخالفة")}
                  subtitle={safeText(
                    finding.description,
                    "بدون وصف تفصيلي"
                  )}
                  rightBadge={
                    <SoftBadge
                      label={toFindingSeverityLabel(finding.severity)}
                      tone={
                        String(finding.severity || "").toLowerCase() === "critical"
                          ? "red"
                          : String(finding.severity || "").toLowerCase() === "major"
                          ? "amber"
                          : "slate"
                      }
                    />
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="آخر الزيارات"
          subtitle="الزيارات المرتبطة بالنظام أو بالمبنى الخاص بهذا الأصل"
        >
          {relatedVisits.length === 0 ? (
            <EmptyPanel
              title="لا توجد زيارات"
              description="عند إنشاء زيارة لهذا الأصل ستظهر هنا."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {relatedVisits.slice(0, 6).map((visit: any) => (
                <ListRow
                  key={String(visit.visit_id || "")}
                  href={`/visits/${String(visit.visit_id || "")}`}
                  title={toVisitTypeLabel(visit.visit_type)}
                  subtitle={`التاريخ: ${String(
                    visit.planned_date || visit.visit_date || "-"
                  )}`}
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
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="تعديل بيانات الأصل"
          subtitle="تعديل البيانات الأساسية والاستحقاق وجدول الفحص"
        >
          <EditAssetForm
            asset={{
              asset_id: String(asset.asset_id || ""),
              asset_code: String(asset.asset_code || ""),
              asset_name: String(asset.asset_name || ""),
              asset_name_ar: String(asset.asset_name_ar || ""),
              asset_type: String(asset.asset_type || ""),
              location_note: String(asset.location_note || ""),
              status: String(asset.status || "active"),
              inspection_interval_days: String(asset.inspection_interval_days || ""),
              last_inspected_at: String(asset.last_inspected_at || ""),
              next_due_date: String(asset.next_due_date || ""),
            }}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
