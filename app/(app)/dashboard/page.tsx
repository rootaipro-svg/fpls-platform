import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  Settings,
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

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard", "view");

  const [facilities, visits, visitSystems] = await Promise.all([
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "VISITS"),
    readSheet(actor.workbookId, "VISIT_SYSTEMS"),
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
            label="متأخر"
            value={overdueVisits}
            hint="زيارات تحتاج تنفيذ"
            icon={AlertTriangle}
            tone={overdueVisits > 0 ? "amber" : "slate"}
          />
          <StatCard
            label="مكتمل"
            value={completedVisits}
            hint="زيارات مغلقة"
            icon={ClipboardList}
            tone="slate"
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
        </div>

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
          value={facilities.length}
          hint="إجمالي المنشآت المسجلة"
          icon={Building2}
          tone="teal"
        />
        <StatCard
          label="العناصر المستحقة"
          value={dueItems.length}
          hint="المتأخر واليوم والقريب"
          icon={AlertTriangle}
          tone={dueItems.length > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="الزيارات"
          value={visits.length}
          hint="إجمالي الزيارات المسجلة"
          icon={ClipboardList}
          tone="slate"
        />
      </div>

      <div className="quick-links-grid">
        <Link href="/due" className="quick-link-card">
          <div className="quick-link-title">فتح العناصر المستحقة</div>
          <div className="quick-link-text">
            اعرض الأنظمة المتأخرة أو القريبة، وأنشئ زيارات متابعة مباشرة منها.
          </div>
          <CardLinkHint label="فتح الصفحة" />
        </Link>

        <Link href="/settings" className="quick-link-card">
          <div className="quick-link-title">إعدادات العميل</div>
          <div className="quick-link-text">
            خصص اسم الجهة والشعار وبيانات التوقيع لتظهر داخل التقارير.
          </div>
          <CardLinkHint label="فتح الإعدادات" />
        </Link>
      </div>

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
              <div key={String(visit.visit_id)} className="visit-item">
                <div className="visit-item-top">
                  <div>
                    <div className="visit-item-title">
                      {String(visit.visit_type || "زيارة")}
                    </div>
                    <div className="visit-item-date">
                      {String(visit.planned_date || visit.visit_date || "-")}
                    </div>
                  </div>

                  <span className="badge">
                    {String(visit.visit_status || "planned")}
                  </span>
                </div>

                <div className="visit-item-text">
                  {String(visit.summary_result || visit.notes || "لا توجد ملاحظات")}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
