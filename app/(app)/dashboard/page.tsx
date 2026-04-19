import Link from "next/link";
import {
  Activity,
  Boxes,
  Building2,
  ClipboardList,
  QrCode,
  ShieldAlert,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { MetricCard } from "@/components/metric-card";
import { ActionCard } from "@/components/action-card";
import { EmptyState } from "@/components/empty-state";
import { VisitCard } from "@/components/visit-card";
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

function parseAllowedSystems(value: any) {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function DashboardPage() {
  const actor = await requirePermission("dashboard", "view");

  const [facilities, visits, visitSystems, assets, findings, buildings] =
    await Promise.all([
      readSheet(actor.workbookId, "FACILITIES"),
      readSheet(actor.workbookId, "VISITS"),
      readSheet(actor.workbookId, "VISIT_SYSTEMS"),
      readSheet(actor.workbookId, "ASSETS"),
      readSheet(actor.workbookId, "FINDINGS"),
      readSheet(actor.workbookId, "BUILDINGS"),
    ]);

  const currentInspector =
    actor.role === "inspector"
      ? await getCurrentInspector(actor.workbookId, actor)
      : null;

  if (actor.role === "inspector" && !currentInspector) {
    return (
      <AppShell>
        <PageHero
          eyebrow="لوحة المفتش"
          title="لوحة المفتش"
          subtitle="لا يوجد ملف مفتش مربوط بهذا الحساب"
        />
        <EmptyState
          title="لا يوجد ملف مفتش"
          description="أضف app_user_id أو email الصحيح داخل شيت INSPECTORS."
        />
      </AppShell>
    );
  }

  const allowedSystems =
    actor.role === "inspector"
      ? parseAllowedSystems(currentInspector?.allowed_systems)
      : [];

  const visibleVisits =
    actor.role === "inspector"
      ? visits.filter((visit: any) =>
          isVisitAssignedToInspector(
            visit,
            String(currentInspector?.inspector_id || "")
          )
        )
      : visits;

  const visibleAssets =
    actor.role === "inspector"
      ? assets.filter((asset: any) => {
          const systemCode = String(asset.system_code || "");
          return allowedSystems.includes("*") || allowedSystems.includes(systemCode);
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

  const visibleFacilities =
    actor.role === "inspector"
      ? facilities.filter((facility: any) =>
          visibleAssets.some(
            (asset: any) =>
              String(asset.facility_id || "") === String(facility.facility_id || "")
          )
        )
      : facilities;

  const openFindingsCount = visibleFindings.filter((finding: any) => {
    const status = String(
      finding.closure_status || finding.compliance_status || ""
    ).toLowerCase();
    return status !== "closed";
  }).length;

  const latestVisits = sortByDateDesc(visibleVisits, "planned_date").slice(0, 5);

  return (
    <AppShell>
      <PageHero
        eyebrow={
          actor.role === "inspector"
            ? "لوحة المفتش"
            : "إدارة العمليات المركزية"
        }
        title={actor.role === "inspector" ? "لوحة المفتش" : "لوحة التحكم"}
        subtitle={
          actor.role === "inspector"
            ? `مرحبًا ${
                currentInspector?.full_name_ar ||
                currentInspector?.full_name ||
                actor.email ||
                "Inspector"
              }`
            : "الوصول السريع لأهم وظائف التشغيل والإدارة"
        }
        chips={["حالة النظام: متصل", `تاريخ اليوم: ${new Date().toISOString().slice(0, 10)}`]}
      />

      <div className="space-y-4">
        <section className="grid gap-4">
          {actor.role === "inspector" ? (
            <>
              <MetricCard
                title="زياراتي"
                value={visibleVisits.length}
                subtitle="كل الزيارات المعينة لك"
                icon={ClipboardList}
                tone="teal"
              />
              <MetricCard
                title="المخالفات المفتوحة"
                value={openFindingsCount}
                subtitle="تحتاج متابعة"
                icon={ShieldAlert}
                tone={openFindingsCount > 0 ? "red" : "slate"}
              />
            </>
          ) : (
            <>
              <MetricCard
                title="المنشآت"
                value={visibleFacilities.length}
                subtitle="إجمالي المنشآت"
                icon={Building2}
                tone="teal"
              />
              <MetricCard
                title="الأصول"
                value={visibleAssets.length}
                subtitle="كل الأصول المسجلة"
                icon={Boxes}
                tone="slate"
              />
              <MetricCard
                title="المخالفات المفتوحة"
                value={openFindingsCount}
                subtitle="تحتاج متابعة"
                icon={ShieldAlert}
                tone={openFindingsCount > 0 ? "red" : "slate"}
              />
            </>
          )}
        </section>

        {actor.role !== "inspector" ? (
          <section className="grid gap-4">
            <ActionCard
              href="/unassigned-visits"
              title="توزيع المهام"
              text="راجع الزيارات المفتوحة وغير المسندة وعيّن المفتش المناسب بسرعة."
              buttonLabel="فتح التوزيع"
              icon={Users}
            />
            <ActionCard
              href="/facilities/new"
              title="إضافة منشأة"
              text="سجل منشأة جديدة داخل النظام مع بياناتها الأساسية."
              buttonLabel="منشأة جديدة"
              icon={Building2}
            />
            <ActionCard
              href="/assets/labels"
              title="طباعة ملصقات QR"
              text="اطبع الملصقات الجماعية للأصول لاستخدامها ميدانيًا."
              buttonLabel="فتح الملصقات"
              icon={QrCode}
            />
          </section>
        ) : null}

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 text-right">
            <div className="text-3xl font-extrabold text-slate-950">
              سجل المهام والزيارات
            </div>
            <div className="mt-2 text-base text-slate-500">
              متابعة سريعة لأحدث الحركة التشغيلية
            </div>
          </div>

          {latestVisits.length === 0 ? (
            <EmptyState
              title="لا توجد زيارات"
              description="ستظهر هنا أحدث الزيارات تلقائيًا."
              icon={Activity}
            />
          ) : (
            <div className="space-y-4">
              {latestVisits.map((visit: any) => {
                const facility = facilities.find(
                  (f: any) =>
                    String(f.facility_id) === String(visit.facility_id || "")
                );
                const building = buildings.find(
                  (b: any) =>
                    String(b.building_id) === String(visit.building_id || "")
                );

                return (
                  <VisitCard
                    key={String(visit.visit_id)}
                    visit={visit}
                    facilityName={String(facility?.facility_name || "")}
                    buildingName={String(building?.building_name || "")}
                  />
                );
              })}
            </div>
          )}

          {actor.role !== "inspector" ? (
            <div className="mt-4 text-left">
              <Link
                href="/visits"
                className="text-sm font-bold text-teal-700 hover:text-teal-800"
              >
                عرض كل الزيارات
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
