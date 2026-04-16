import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { DueItemCard } from "@/components/due-item-card";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function daysBetween(today: Date, target: Date) {
  const ms = target.getTime() - today.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function getDueState(daysDiff: number) {
  if (daysDiff < 0) return "overdue";
  if (daysDiff === 0) return "today";
  if (daysDiff <= 7) return "soon";
  return "future";
}

export default async function DuePage() {
  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [visitSystems, visits, facilities, buildings] = await Promise.all([
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
  ]);

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueItems = Array.from(latestByBuildingSystem.values())
    .filter((row) => String(row.next_due_date || "").trim() !== "")
    .map((row) => {
      const nextDue = new Date(String(row.next_due_date));
      nextDue.setHours(0, 0, 0, 0);

      const daysDiff = daysBetween(today, nextDue);
      const state = getDueState(daysDiff);

      const visit = visits.find(
        (v) => String(v.visit_id) === String(row.visit_id || "")
      );

      const facility = facilities.find(
        (f) => String(f.facility_id) === String(visit?.facility_id || "")
      );

      const building = buildings.find(
        (b) => String(b.building_id) === String(visit?.building_id || "")
      );

      return {
        building_system_id: String(row.building_system_id || ""),
        system_code: String(row.system_code || ""),
        facility_name: String(facility?.facility_name || "منشأة غير محددة"),
        building_name: String(building?.building_name || ""),
        next_due_date: String(row.next_due_date || ""),
        state,
        days_diff: daysDiff,
      };
    })
    .filter((item) => item.state !== "future")
    .sort((a, b) => a.days_diff - b.days_diff);

  const overdueCount = dueItems.filter((i) => i.state === "overdue").length;
  const todayCount = dueItems.filter((i) => i.state === "today").length;
  const soonCount = dueItems.filter((i) => i.state === "soon").length;

  return (
    <AppShell>
      <PageHeader
        title="العناصر المستحقة"
        subtitle="العناصر القريبة أو المتأخرة التي تحتاج إنشاء زيارة متابعة"
      />

      <div className="findings-summary">
        <StatCard label="متأخر" value={overdueCount} hint="تجاوز تاريخ الاستحقاق" />
        <StatCard label="اليوم" value={todayCount} hint="مستحق اليوم" />
        <StatCard label="قريب" value={soonCount} hint="خلال 7 أيام" />
      </div>

      {dueItems.length === 0 ? (
        <EmptyState
          title="لا توجد عناصر مستحقة"
          description="لا توجد أنظمة مستحقة حاليًا أو قريبة خلال الأيام القادمة."
          icon={AlertTriangle}
        />
      ) : (
        <div className="due-grid">
          {dueItems.map((item) => (
            <DueItemCard
              key={`${item.building_system_id}-${item.next_due_date}`}
              item={item}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
