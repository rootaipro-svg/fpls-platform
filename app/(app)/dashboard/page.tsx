import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Building2,
  ClipboardList,
  Clock3,
  QrCode,
  ShieldAlert,
  UserRound,
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

  const latestByBuildingSystem = new Map<string, any>();

  for (const row of visitSystems) {
    const key = String(row.building_system_id || "");
    if (!key) continue;

    const current = latestByBuildingSystem.get(key);
    const rowStamp = String(
      row.updated_at || row.actual_end_time || row.next_due_date || ""
    );
    const currentStamp = String(
      current?.updated_at || current?.actual_end_time || current?.next_due_date || ""
    );

    if (!current || rowStamp > currentStamp) {
      latestByBuildingSystem.set(key, row);
    }
  }

  const dueItems =
    actor.role === "inspector"
      ? []
      : Array.from(latestByBuildingSystem.values()).filter((row) => {
          if (!String(row.next_due_date || "").trim()) return false;

          const due = new Date(String(row.next_due_date));
          due.setHours(0, 0, 0, 0);

          return daysBetween(today, due) <= 7;
        });

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
            icon={ClipboardList}
            tone="slate"
          />
          <StatCard
            label="أصول مستحقة"
            value={dueAssets.length}
            hint="متأخر واليوم والقريب"
            icon={Clock3}
            tone={dueAssets.length > 0 ? "amber" : "slate"}
          />
          <StatCard
            label="مخالفات مفتوحة"
            value={openVisibleFindingsCount}
            hint="تحتاج متابعة"
            icon={ShieldAlert}
            tone={openVisibleFindingsCount > 0 ? "red" : "slate"}
          />
        </div>

        <div className="quick-links-grid">
          <Link href="/visits" className="quick-link-card">
            <div className="quick-link-title">فتح زياراتي</div>
            <div className="quick-link-text">
              اعرض كل الزيارات المعيّنة لك وابدأ التنفيذ أو أكمل الزيارة.
            </div>
            <CardLinkHint label="فتح الزيارات" />
          </Link>

          <Link href="/assets" className="quick-link-card">
            <div className="quick-link-title">لوحة الأصول</div>
            <div className="quick-link-text">
              افتح الأصول المتاحة لك، واعرض QR وابدأ الفحص مباشرة.
            </div>
            <CardLinkHint label="فتح الأصول" />
          </Link>

          <Link href="/findings" className="quick-link-card">
            <div className="quick-link-title">المخالفات</div>
            <div className="quick-link-text">
              راجع المخالفات المفتوحة وتابع الإجراء التصحيحي والإغلاق.
            </div>
            <CardLinkHint label="فتح المخالفات" />
          </Link>
        </div>

        <section className="card">
          <div className="section-title">الأصول المستحقة الآن</div>

          {dueAssets.length === 0 ? (
            <div style={{ marginTop: "12px" }}>
              <EmptyState
                title="لا توجد أصول مستحقة حاليًا"
                description="كل الأصول ضمن المدى الزمني الحالي أو لم يتم ضبط جدولها بعد."
                icon={Clock3}
              />
            </div>
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
          <div className="section-title">آخر الزيارات المعيّنة لك</div>

          {latestVisits.length === 0 ? (
            <div style={{ marginTop: "12px" }}>
              <EmptyState
                title="لا توجد زيارات مخصصة لك"
                description="عند تعيين زيارات لك ستظهر هنا مباشرة."
                icon={ClipboardList}
              />
            </div>
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
        subtitle="متابعة المنشآت والزيارات والعناصر المستحقة"
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
          label="أصول مستحقة"
          value={dueAssets.length}
          hint="متأخر واليوم والقريب"
          icon={Clock3}
          tone={dueAssets.length > 0 ? "amber" : "slate"}
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
        <section className="card" style={{ border: "1px solid #fecaca", background: "#fff7f7" }}>
          <div className="section-header-row">
            <div>
              <div className="section-title">تنبيه تشغيلي</div>
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
        <div className="section-header-row">
          <div>
            <div className="section-title">اختصارات سريعة</div>
            <div className="section-subtitle">
              انتقال مباشر إلى الأصول وملصقات QR والمخالفات والمتابعة
            </div>
          </div>

          <div className="badge-wrap">
            <Link href="/assets" className="btn btn-secondary">
              لوحة الأصول
            </Link>

            <Link href="/assets/labels" className="btn btn-secondary">
              <QrCode size={16} />
              ملصقات QR
            </Link>
          </div>
        </div>
      </section>

      <div className="quick-links-grid">
        <Link href="/due" className="quick-link-card">
          <div className="quick-link-title">فتح العناصر المستحقة</div>
          <div className="quick-link-text">
            اعرض الأنظمة المتأخرة أو القريبة، وأنشئ زيارات متابعة مباشرة منها.
          </div>
          <CardLinkHint label="فتح الصفحة" />
        </Link>

        <Link href="/assets" className="quick-link-card">
          <div className="quick-link-title">لوحة الأصول</div>
          <div className="quick-link-text">
            افتح الأصول، ابحث وفلتر، وابدأ الفحص أو اطبع ملصقات QR.
          </div>
          <CardLinkHint label="فتح الأصول" />
        </Link>

        <Link href="/findings" className="quick-link-card">
          <div className="quick-link-title">المخالفات</div>
          <div className="quick-link-text">
            راجع المخالفات المفتوحة وتابع الإغلاقات والإجراءات التصحيحية.
          </div>
          <CardLinkHint label="فتح المخالفات" />
        </Link>

        <Link href="/unassigned-visits" className="quick-link-card">
          <div className="quick-link-title">الزيارات غير المسندة</div>
          <div className="quick-link-text">
            راجع الزيارات المفتوحة التي لم تُسند بعد، وعيّن المفتش المناسب بسرعة.
          </div>
          <CardLinkHint label="فتح الصفحة" />
        </Link>
      </div>

      <section className="card">
        <div className="section-title">الأصول المستحقة الآن</div>

        {dueAssets.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد أصول مستحقة حاليًا"
              description="كل الأصول ضمن المدى الزمني الحالي أو لم يتم ضبط جدولها بعد."
              icon={Clock3}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
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
        )}
      </section>

      <section className="card">
        <div className="section-title">ملخص تشغيلي سريع</div>
        <div className="badge-wrap" style={{ marginTop: "12px" }}>
          <span className="badge">الزيارات: {visibleVisits.length}</span>
          <span className="badge">الأصول: {visibleAssets.length}</span>
          <span className="badge">أصول مستحقة: {dueAssets.length}</span>
          <span className="badge">
            المخالفات المفتوحة: {openVisibleFindingsCount}
          </span>
          <span className="badge">
            زيارات غير مسندة: {unassignedOpenVisits.length}
          </span>
        </div>
      </section>

      <section className="card">
        <div className="section-title">آخر الزيارات</div>

        {latestVisits.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد زيارات حتى الآن"
              description="بعد إنشاء زيارة جديدة ستظهر هنا آخر الزيارات المنفذة أو المجدولة."
              icon={ClipboardList}
            />
          </div>
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
