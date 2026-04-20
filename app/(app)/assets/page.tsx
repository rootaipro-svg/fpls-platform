import { Boxes, Building2, Clock3, QrCode, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  ActionCard,
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
  getCurrentInspector,
} from "@/lib/current-inspector";
import {
  safeText,
  toSystemLabel,
  isOpenFindingStatus,
} from "@/lib/display";

function parseAllowedSystems(value: any) {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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

function getDueLabel(nextDueDate: string) {
  if (!nextDueDate) return "غير محدد";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(nextDueDate);
  if (Number.isNaN(due.getTime())) return "غير محدد";

  due.setHours(0, 0, 0, 0);
  const daysDiff = daysBetween(today, due);

  if (daysDiff < 0) return "متأخر";
  if (daysDiff === 0) return "اليوم";
  if (daysDiff <= 7) return "قريب";
  return "مستقبلي";
}

function dueTone(label: string) {
  if (label === "متأخر") return "red" as const;
  if (label === "اليوم") return "amber" as const;
  if (label === "قريب") return "teal" as const;
  return "slate" as const;
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ facility_id?: string }>;
}) {
  const search = await searchParams;
  const facilityIdFilter = String(search?.facility_id || "");

  const actor = await requirePermission("facilities", "view");

  const [assets, facilities, buildings, findings] = await Promise.all([
    readSheet(actor.workbookId, "ASSETS"),
    readSheet(actor.workbookId, "FACILITIES"),
    readSheet(actor.workbookId, "BUILDINGS"),
    readSheet(actor.workbookId, "FINDINGS"),
  ]);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(actor.workbookId, actor)
      : null;

  const allowedSystems =
    actor.role === "inspector"
      ? parseAllowedSystems(currentInspector?.allowed_systems)
      : [];

  const visibleAssetsBase =
    actor.role === "inspector"
      ? assets.filter((asset: any) => {
          const systemCode = String(asset.system_code || "");
          return allowedSystems.includes("*") || allowedSystems.includes(systemCode);
        })
      : assets;

  const visibleAssets = facilityIdFilter
    ? visibleAssetsBase.filter(
        (asset: any) =>
          String(asset.facility_id || "") === String(facilityIdFilter)
      )
    : visibleAssetsBase;

  const sortedAssets = sortByDateDesc(visibleAssets, "updated_at");

  const facilityIds = new Set(
    visibleAssets.map((row: any) => String(row.facility_id || "")).filter(Boolean)
  );

  const dueSoonCount = visibleAssets.filter((asset: any) => {
    const label = getDueLabel(String(asset.next_due_date || ""));
    return label === "متأخر" || label === "اليوم" || label === "قريب";
  }).length;

  const openFindingsCount = findings.filter((row: any) =>
    isOpenFindingStatus(row.closure_status || row.compliance_status || "")
  ).length;

  const facilityName =
    facilityIdFilter
      ? safeText(
          facilities.find(
            (f: any) => String(f.facility_id || "") === String(facilityIdFilter)
          )?.facility_name,
          "المنشأة"
        )
      : "";

  return (
    <AppShell>
      <PageHero
        eyebrow="لوحة الأصول والمكونات"
        title={facilityIdFilter ? `أصول ${facilityName}` : "الأصول"}
        subtitle={
          facilityIdFilter
            ? "عرض الأصول التابعة للمنشأة المحددة"
            : "عرض موحد للأصول مع حالتها والاستحقاق القادم"
        }
        icon={Boxes}
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
          label="إجمالي الأصول"
          value={visibleAssets.length}
          hint="كل الأصول المعروضة"
          icon={Boxes}
          tone="teal"
        />
        <MetricCard
          label="الاستحقاقات"
          value={dueSoonCount}
          hint="متأخرة أو قريبة"
          icon={Clock3}
          tone={dueSoonCount > 0 ? "amber" : "slate"}
        />
        <MetricCard
          label="المنشآت"
          value={facilityIds.size}
          hint="منشآت تحتوي أصولًا"
          icon={Building2}
          tone="slate"
        />
        <MetricCard
          label="المخالفات"
          value={openFindingsCount}
          hint="مفتوحة وتحتاج متابعة"
          icon={ShieldAlert}
          tone={openFindingsCount > 0 ? "red" : "slate"}
        />
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="اختصارات سريعة"
          subtitle="أهم الصفحات المرتبطة بالأصول"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            <ActionCard href="/facilities" title="المنشآت" icon={Building2} tone="teal" />
            <ActionCard href="/assets/labels" title="ملصقات QR" icon={QrCode} tone="slate" />
            <ActionCard href="/findings" title="المخالفات" icon={ShieldAlert} tone="red" />
            <ActionCard href="/reports" title="التقارير" icon={Boxes} tone="slate" />
          </div>
        </SectionCard>
      </div>

      <div style={{ marginTop: "14px" }}>
        <SectionCard
          title="قائمة الأصول"
          subtitle="الوصول المباشر إلى كل أصل وحالته الحالية"
        >
          {sortedAssets.length === 0 ? (
            <EmptyPanel
              title="لا توجد أصول"
              description="عند إضافة أصل جديد سيظهر هنا مباشرة."
            />
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {sortedAssets.map((asset: any) => {
                const facility = facilities.find(
                  (row: any) =>
                    String(row.facility_id || "") === String(asset.facility_id || "")
                );

                const building = buildings.find(
                  (row: any) =>
                    String(row.building_id || "") === String(asset.building_id || "")
                );

                const dueLabel = getDueLabel(String(asset.next_due_date || ""));

                return (
                  <ListRow
                    key={String(asset.asset_id || "")}
                    href={`/assets/${String(asset.asset_id || "")}`}
                    title={safeText(
                      asset.asset_name_ar || asset.asset_name,
                      "أصل"
                    )}
                    subtitle={`${safeText(
                      facility?.facility_name,
                      "منشأة غير محددة"
                    )}${building ? ` · ${String(building.building_name || "")}` : ""} · ${toSystemLabel(
                      asset.system_code
                    )}`}
                    rightBadge={
                      <SoftBadge
                        label={dueLabel}
                        tone={dueTone(dueLabel)}
                      />
                    }
                  />
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
