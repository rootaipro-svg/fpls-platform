import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  Clock3,
  QrCode,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { CardLinkHint } from "@/components/card-link-hint";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

function daysBetween(today: Date, target: Date) {
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function parseAllowedSystems(value: any) {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sortByDueDateAsc(rows: any[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.next_due_date || 0)).getTime();
    const bTime = new Date(String(b?.next_due_date || 0)).getTime();
    return aTime - bTime;
  });
}

function getDueLabel(daysDiff: number) {
  if (daysDiff < 0) return "متأخر";
  if (daysDiff === 0) return "اليوم";
  if (daysDiff <= 7) return "قريب";
  return "مستقبلي";
}

function ShortcutCard({
  href,
  title,
  text,
  hint,
  icon: Icon,
  tone = "teal",
}: {
  href: string;
  title: string;
  text: string;
  hint: string;
  icon: any;
  tone?: "teal" | "amber" | "red" | "slate";
}) {
  const toneMap: Record<string, { bg: string; color: string; border: string }> = {
    teal: {
      bg: "#ecfeff",
      color: "#0f766e",
      border: "1px solid #ccfbf1",
    },
    amber: {
      bg: "#fffbeb",
      color: "#b45309",
      border: "1px solid #fde68a",
    },
    red: {
      bg: "#fef2f2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
    slate: {
      bg: "#f8fafc",
      color: "#334155",
      border: "1px solid #e2e8f0",
    },
  };

  const theme = toneMap[tone] || toneMap.teal;

  return (
    <Link href={href} className="quick-link-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.bg,
            color: theme.color,
            border: theme.border,
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>

        <div className="quick-link-title" style={{ margin: 0 }}>
          {title}
        </div>
      </div>

      <div className="quick-link-text">{text}</div>
      <CardLinkHint label={hint} />
    </Link>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div className="section-title">{title}</div>
      <div className="section-subtitle">{subtitle}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard", "view");

  const [facilities, visits, visitSystems, assets, findings] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "VISIT_SYSTEMS"),
    readSheet(actor.workbookId, "ASSETS"),
    readSheet(actor.workbookId, "FINDINGS"),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(actor.workbookId, actor)
      : null;

  const visibleVisits =
    actor.role === "inspector"
      ? visits.filter((visit: any) =>
          isVisitAssignedToInspector(
            visit,
            String(currentInspector?.inspector_id || "")
          )
        )
      : visits;

  const latestVisits = sortByDateDesc(visibleVisits, "planned_date").slice(0, 5);

  const todaysVisits = visibleVisits.filter(
    (visit: any) =>
      String(visit.planned_date || visit.visit_date || "") === todayIso
  ).length;

  const overdueVisits = visibleVisits.filter((visit: any) => {
    const status = String(visit.visit_status || "").toLowerCase();
    const planned = String(visit.planned_date || "");
    if (!planned) return false;
    if (status === "closed" || status === "completed") return false;
    return planned < todayIso;
  }).length;

  const completedVisits = visibleVisits.filter((visit: any) => {
    const status = String(visit.visit_status || "").toLowerCase();
    return status === "closed" || status === "completed";
  }).length;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
        <PageHeader
          title="لوحة المفتش"
          subtitle="لم يتم ربط حسابك بسجل مفتش داخل INSPECTORS"
        />

        <EmptyState
          title="لا يوجد ملف مفتش لهذا الحساب"
          description="أضف app_user_id أو email الصحيح داخل شيت INSPECTORS لربط هذا الحساب بالمفتش."
          icon={UserRound}
        />
      </AppShell>
    );
  }

  const allowedSystems =
    actor.role === "inspector"
      ? parseAllowedSystems(currentInspector?.allowed_systems)
      : [];

  const visibleAssets =
    actor.role === "inspector"
      ? assets.filter((asset: any) => {
          const systemCode = String(asset.system_code || "");
          return (
            allowedSystems.includes("*") || allowedSystems.includes(systemCode)
          );
        })
      : assets;

  const visibleVisitIds = new Set(
    visibleVisits.map((visit: any) => String(visit.visit_id))
  );

  const visibleVisitSystemIds = new Set(
    visitSystems
      .filter((vs: any) => visibleVisitIds.has(String(vs.visit_id)))
      .map((vs: any) => String(vs.visit_system_id))
  );

  const visibleFindings =
    actor.role === "inspector"
      ? findings.filter((finding: any) =>
          visibleVisitSystemIds.has(String(finding.visit_system_id))
        )
      : findings;

  const openVisibleFindingsCount = visibleFindings.filter((finding: any) => {
    const status = String(
      finding.closure_status || finding.compliance_status || ""
    ).toLowerCase();
    return status !== "closed";
  }).length;

  const visibleFacilities =
    actor.role === "inspector"
      ? facilities.filter((facility: any) =>
          visibleAssets.some(
            (asset: any) =>
              String(asset.facility_id || "") === String(facility.facility_id || "")
          )
        )
      : facilities;

  const dueAssets = sortByDueDateAsc(
    visibleAssets
      .map((asset: any) => {
        const nextDueDate = String(asset.next_due_date || "");
        if (!nextDueDate) return null;

        const due = new Date(nextDueDate);
        if (Number.isNaN(due.getTime())) return null;

        due.setHours(0, 0, 0, 0);
        const daysDiff = daysBetween(today, due);

        if (daysDiff > 7) return null;

        return {
          asset_id: String(asset.asset_id || ""),
          asset_code: String(asset.asset_code || ""),
          asset_name: String(asset.asset_name || ""),
          asset_name_ar: String(asset.asset_name_ar || ""),
          system_code: String(asset.system_code || ""),
          next_due_date: nextDueDate,
          due_days_diff: daysDiff,
          due_label: getDueLabel(daysDiff),
        };
      })
      .filter(Boolean)
  );

  const overdueDueAssetsCount = dueAssets.filter(
    (asset: any) => Number(asset.due_days_diff) < 0
  ).length;

  const unassignedOpenVisits =
    actor.role === "inspector"
      ? []
      : visits.filter((visit: any) => {
          const status = String(visit.visit_status || "").toLowerCase();
          const assigned = String(visit.assigned_inspector_id || "").trim();

          return (
            status !== "closed" &&
            status !== "completed" &&
            assigned.length === 0
          );
        });

  if (actor.role === "inspector") {
    return (
      <AppShell>
        <PageHeader
          title="لوحة المفتش"
          subtitle={`مرحبًا ${
            currentInspector?.full_name_ar ||
            currentInspector?.full_name ||
            actor.email ||
            "Inspector"
          }`}
        />

        <div className="stats-grid">
          <StatCard
            label="زياراتي"
            value={visibleVisits.length}
            hint="كل الزيارات المعينة لك"
            icon={ClipboardList}
            tone="teal"
          />
          <StatCard
            label="اليوم"
            value={todaysVisits}
            hint="زيارات اليوم"
            icon={Clock3}
            tone="slate"
          />
          <StatCard
            label="متأخر"
            value={overdueVisits}
            hint="زيارات تحتاج تنفيذ"
            icon={AlertTriangle}
            tone={overdueVisits > 0 ? "amber" : "slate"}
          />
          <StatCard
            label="مخالفات مفتوحة"
            value={openVisibleFindingsCount}
            hint="تحتاج متابعة"
            icon={ShieldAlert}
            tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
          />
        </div>

        <section className="card">
          <SectionTitle
            title="البدء السريع"
            subtitle="كل ما يحتاجه المفتش لبدء التنفيذ والمتابعة الميدانية"
          />

          <div className="quick-links-grid">
            <ShortcutCard
              href="/visits"
              title="زياراتي"
              text="اعرض كل الزيارات المسندة لك وابدأ التنفيذ أو أكمل الزيارة."
              hint="فتح الزيارات"
              icon={ClipboardList}
              tone="teal"
            />

            <ShortcutCard
              href="/assets"
              title="لوحة الأصول"
              text="افتح الأصول المسموح لك بها، وراجع QR وابدأ الفحص من الأصل."
              hint="فتح الأصول"
              icon={Boxes}
              tone="slate"
            />

            <ShortcutCard
              href="/findings"
              title="المخالفات"
              text="راجع المخالفات المفتوحة وتابع الإجراء التصحيحي والإغلاق."
              hint="فتح المخالفات"
              icon={ShieldAlert}
              tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
            />
          </div>
        </section>

        <section className="card">
          <SectionTitle
            title="الأصول المستحقة الآن"
            subtitle="أصول تحتاج اهتمامًا قريبًا أو فوريًا ضمن الأنظمة المسموح لك بها"
          />

          {dueAssets.length === 0 ? (
            <EmptyState
              title="لا توجد أصول مستحقة حاليًا"
              description="كل الأصول ضمن المدى الزمني الحالي أو لم يتم ضبط جدولها بعد."
              icon={Clock3}
            />
          ) : (
            <div className="stack-3" style={{ marginTop: "12px" }}>
              {dueAssets.slice(0, 5).map((asset: any) => (
                <Link
                  key={String(asset.asset_id)}
                  href={`/assets/${String(asset.asset_id)}`}
                  className="quick-link-card"
                >
                  <div className="quick-link-title">
                    {String(
                      asset.asset_name_ar ||
                        asset.asset_name ||
                        asset.asset_code ||
                        asset.asset_id
                    )}
                  </div>
                  <div className="quick-link-text">
                    {String(asset.system_code || "-")} · الاستحقاق:{" "}
                    {String(asset.next_due_date || "-")} · {String(asset.due_label)}
                  </div>
                  <CardLinkHint label="فتح الأصل" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <SectionTitle
            title="آخر الزيارات المعيّنة لك"
            subtitle="وصول سريع إلى أحدث الزيارات التي تعمل عليها"
          />

          {latestVisits.length === 0 ? (
            <EmptyState
              title="لا توجد زيارات مخصصة لك"
              description="عند تعيين زيارات لك ستظهر هنا مباشرة."
              icon={ClipboardList}
            />
          ) : (
            <div className="stack-3" style={{ marginTop: "12px" }}>
              {latestVisits.map((visit: any) => (
                <Link
                  key={String(visit.visit_id)}
                  href={`/visits/${visit.visit_id}`}
                  className="quick-link-card"
                >
                  <div className="quick-link-title">
                    {String(visit.visit_type || "زيارة")}
                  </div>
                  <div className="quick-link-text">
                    التاريخ: {String(visit.planned_date || visit.visit_date || "-")}
                  </div>
                  <CardLinkHint label="فتح الزيارة" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="لوحة التحكم"
        subtitle="متابعة المنشآت والأصول والزيارات والمخالفات والتوزيع التشغيلي"
      />

      <div className="stats-grid">
        <StatCard
          label="المنشآت"
          value={visibleFacilities.length}
          hint="إجمالي المنشآت المسجلة"
          icon={Building2}
          tone="teal"
        />
        <StatCard
          label="الأصول"
          value={visibleAssets.length}
          hint="إجمالي الأصول المسجلة"
          icon={Boxes}
          tone="slate"
        />
        <StatCard
          label="زيارات غير مسندة"
          value={unassignedOpenVisits.length}
          hint="تحتاج توزيعًا سريعًا"
          icon={Users}
          tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="المخالفات المفتوحة"
          value={openVisibleFindingsCount}
          hint="تحتاج متابعة"
          icon={ShieldAlert}
          tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
        />
      </div>

      {unassignedOpenVisits.length > 0 ? (
        <section
          className="card"
          style={{
            border: "1px solid #fecaca",
            background: "#fff7f7",
          }}
        >
          <div className="section-header-row">
            <div>
              <div className="section-title">تنبيه تشغيلي مهم</div>
              <div className="section-subtitle">
                توجد زيارات مفتوحة غير مسندة لمفتش، ويجب توزيعها حتى لا تتعطل أعمال التنفيذ.
              </div>
            </div>

            <div className="badge-wrap">
              <span className="badge">غير مسندة: {unassignedOpenVisits.length}</span>
              <Link href="/unassigned-visits" className="btn btn-secondary">
                فتح الزيارات غير المسندة
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="card">
        <SectionTitle
          title="مركز التشغيل اليومي"
          subtitle="أهم الصفحات اليومية الخاصة بالمتابعة والتوزيع والتنفيذ"
        />

        <div className="quick-links-grid">
          <ShortcutCard
            href="/unassigned-visits"
            title="الزيارات غير المسندة"
            text="راجع الزيارات المفتوحة التي لم تُسند بعد، وعيّن المفتش المناسب بسرعة."
            hint="فتح الصفحة"
            icon={Users}
            tone={unassignedOpenVisits.length > 0 ? "amber" : "slate"}
          />

          <ShortcutCard
            href="/due"
            title="العناصر المستحقة"
            text="اعرض العناصر والأنظمة المتأخرة أو القريبة، وأنشئ زيارات متابعة مباشرة."
            hint="فتح الصفحة"
            icon={Clock3}
            tone={dueAssets.length > 0 ? "amber" : "slate"}
          />

          <ShortcutCard
            href="/visits"
            title="الزيارات"
            text="افتح كل الزيارات المجدولة أو الجارية وتابع التنفيذ والحالة الحالية."
            hint="فتح الزيارات"
            icon={ClipboardList}
            tone="teal"
          />

          <ShortcutCard
            href="/findings"
            title="المخالفات"
            text="راجع المخالفات المفتوحة وتابع الإغلاقات والإجراءات التصحيحية."
            hint="فتح المخالفات"
            icon={ShieldAlert}
            tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
          />

          <ShortcutCard
            href="/assets"
            title="لوحة الأصول"
            text="استعرض الأصول، وابحث وفلتر، وابدأ الفحص وراجع الاستحقاقات."
            hint="فتح الأصول"
            icon={Boxes}
            tone="slate"
          />

          <ShortcutCard
            href="/assets/labels"
            title="ملصقات QR"
            text="اطبع الملصقات الجماعية للأصول لاستخدامها ميدانيًا وربطها بالمسح."
            hint="فتح الملصقات"
            icon={QrCode}
            tone="slate"
          />
        </div>
      </section>

      <section className="card">
        <SectionTitle
          title="الإدارة والتهيئة"
          subtitle="الوظائف الإدارية الخاصة بالمنشآت والمفتشين والمستخدمين والإعدادات"
        />

        <div className="quick-links-grid">
          <ShortcutCard
            href="/facilities"
            title="المنشآت"
            text="إدارة المنشآت والمباني والأنظمة المثبتة وربط الأصول بها."
            hint="فتح المنشآت"
            icon={Building2}
            tone="teal"
          />

          <ShortcutCard
            href="/inspectors"
            title="إدارة المفتشين"
            text="إضافة المفتشين وربطهم بالحسابات وتحديد الأنظمة المسموحة لهم."
            hint="فتح إدارة المفتشين"
            icon={UserRound}
            tone="slate"
          />

          <ShortcutCard
            href="/settings/users"
            title="المستخدمون والصلاحيات"
            text="تحكم في الأدوار والصلاحيات وحالة الحسابات داخل هذا العميل."
            hint="فتح المستخدمين"
            icon={Users}
            tone="slate"
          />

          <ShortcutCard
            href="/settings"
            title="إعدادات العميل"
            text="تخصيص اسم الجهة والشعار وبيانات التقرير والهوية العامة."
            hint="فتح الإعدادات"
            icon={Settings}
            tone="slate"
          />
        </div>
      </section>

      <section className="card">
        <SectionTitle
          title="الأصول المستحقة الآن"
          subtitle="أهم الأصول التي تحتاج متابعة مباشرة أو قريبة حسب تاريخ الاستحقاق"
        />

        {dueAssets.length === 0 ? (
          <EmptyState
            title="لا توجد أصول مستحقة حاليًا"
            description="كل الأصول ضمن المدى الزمني الحالي أو لم يتم ضبط جدولها بعد."
            icon={Clock3}
          />
        ) : (
          <>
            <div className="badge-wrap" style={{ marginTop: "12px", marginBottom: "12px" }}>
              <span className="badge">المستحقة الآن: {dueAssets.length}</span>
              <span className="badge">المتأخرة: {overdueDueAssetsCount}</span>
            </div>

            <div className="stack-3">
              {dueAssets.slice(0, 6).map((asset: any) => (
                <Link
                  key={String(asset.asset_id)}
                  href={`/assets/${String(asset.asset_id)}`}
                  className="quick-link-card"
                >
                  <div className="quick-link-title">
                    {String(
                      asset.asset_name_ar ||
                        asset.asset_name ||
                        asset.asset_code ||
                        asset.asset_id
                    )}
                  </div>
                  <div className="quick-link-text">
                    {String(asset.system_code || "-")} · الاستحقاق:{" "}
                    {String(asset.next_due_date || "-")} · {String(asset.due_label)}
                  </div>
                  <CardLinkHint label="فتح الأصل" />
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <SectionTitle
          title="ملخص تشغيلي سريع"
          subtitle="لقطة سريعة عن الوضع التشغيلي الحالي داخل النظام"
        />

        <div className="badge-wrap" style={{ marginTop: "12px" }}>
          <span className="badge">الزيارات: {visibleVisits.length}</span>
          <span className="badge">الأصول: {visibleAssets.length}</span>
          <span className="badge">أصول مستحقة: {dueAssets.length}</span>
          <span className="badge">
            زيارات غير مسندة: {unassignedOpenVisits.length}
          </span>
          <span className="badge">
            المخالفات المفتوحة: {openVisibleFindingsCount}
          </span>
        </div>
      </section>

      <section className="card">
        <SectionTitle
          title="آخر الزيارات"
          subtitle="آخر الزيارات المجدولة أو الجارية لسرعة الوصول والمتابعة"
        />

        {latestVisits.length === 0 ? (
          <EmptyState
            title="لا توجد زيارات حتى الآن"
            description="بعد إنشاء زيارة جديدة ستظهر هنا آخر الزيارات المنفذة أو المجدولة."
            icon={ClipboardList}
          />
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {latestVisits.map((visit: any) => (
              <Link
                key={String(visit.visit_id)}
                href={`/visits/${visit.visit_id}`}
                className="quick-link-card"
              >
                <div className="quick-link-title">
                  {String(visit.visit_type || "زيارة")}
                </div>
                <div className="quick-link-text">
                  التاريخ: {String(visit.planned_date || visit.visit_date || "-")}
                </div>
                <CardLinkHint label="فتح الزيارة" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
