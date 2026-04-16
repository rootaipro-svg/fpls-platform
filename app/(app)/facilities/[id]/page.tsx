import { Building2, ClipboardList, ShieldAlert, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { VisitCard } from "@/components/visit-card";
import { FindingCard } from "@/components/finding-card";
import { DueStateBadge } from "@/components/due-state-badge";
import AddBuildingForm from "@/components/add-building-form";
import AddSystemForm from "@/components/add-system-form";
import CreateVisitForm from "@/components/create-visit-form";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";

function sortByDateDesc(rows: any[], field: string) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(String(a?.[field] || 0)).getTime();
    const bTime = new Date(String(b?.[field] || 0)).getTime();
    return bTime - aTime;
  });
}

function severityRank(severity: string) {
  const s = String(severity || "").toLowerCase();
  if (s === "critical") return 0;
  if (s === "major") return 1;
  if (s === "minor") return 2;
  return 3;
}

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

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getSessionUser();
  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [
    facilities,
    buildings,
    buildingSystems,
    visitSystems,
    visits,
    findings,
    inspectors,
    systemsRef,
  ] = await Promise.all([
    readSheet(workbookId, "FACILITIES"),
    readSheet(workbookId, "BUILDINGS"),
    readSheet(workbookId, "BUILDING_SYSTEMS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "FINDINGS"),
    readSheet(workbookId, "INSPECTORS"),
    readSheet(workbookId, "SYSTEMS_REF"),
  ]);

  const facility = facilities.find((f) => String(f.facility_id) === id);

  const facilityBuildings = buildings.filter(
    (b) => String(b.facility_id) === id
  );

  const buildingIds = new Set(
    facilityBuildings.map((b) => String(b.building_id))
  );

  const facilityBuildingSystems = buildingSystems.filter((s) =>
    buildingIds.has(String(s.building_id))
  );

  const buildingSystemIds = new Set(
    facilityBuildingSystems.map((s) => String(s.building_system_id))
  );

  const latestVisitSystemByBuildingSystem = new Map<string, any>();

  for (const row of visitSystems) {
    const key = String(row.building_system_id || "");
    if (!buildingSystemIds.has(key)) continue;

    const current = latestVisitSystemByBuildingSystem.get(key);
    const rowStamp = String(
      row.updated_at || row.actual_end_time || row.next_due_date || ""
    );
    const currentStamp = String(
      current?.updated_at || current?.actual_end_time || current?.next_due_date || ""
    );

    if (!current || rowStamp > currentStamp) {
      latestVisitSystemByBuildingSystem.set(key, row);
    }
  }

  const facilityVisits = sortByDateDesc(
    visits.filter((v) => String(v.facility_id) === id),
    "planned_date"
  );

  const facilityVisitIds = new Set(
    facilityVisits.map((v) => String(v.visit_id))
  );

  const facilityVisitSystems = visitSystems.filter((vs) =>
    facilityVisitIds.has(String(vs.visit_id))
  );

  const facilityVisitSystemIds = new Set(
    facilityVisitSystems.map((vs) => String(vs.visit_system_id))
  );

  const facilityFindings = [...findings]
    .filter((f) => facilityVisitSystemIds.has(String(f.visit_system_id)))
    .sort((a, b) => {
      const aClosed =
        String(a.closure_status || a.compliance_status || "").toLowerCase() ===
        "closed"
          ? 1
          : 0;
      const bClosed =
        String(b.closure_status || b.compliance_status || "").toLowerCase() ===
        "closed"
          ? 1
          : 0;

      if (aClosed !== bClosed) return aClosed - bClosed;
      return (
        severityRank(String(a.severity || "")) -
        severityRank(String(b.severity || ""))
      );
    });

  const openFindingsCount = facilityFindings.filter(
    (f) =>
      String(f.closure_status || f.compliance_status || "").toLowerCase() !==
      "closed"
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSystems = facilityBuildingSystems
    .map((system) => {
      const latest = latestVisitSystemByBuildingSystem.get(
        String(system.building_system_id)
      );

      const nextDueDate = String(latest?.next_due_date || "");
      if (!nextDueDate) return null;

      const due = new Date(nextDueDate);
      due.setHours(0, 0, 0, 0);

      const daysDiff = daysBetween(today, due);
      const state = getDueState(daysDiff);

      return {
        building_system_id: String(system.building_system_id),
        building_id: String(system.building_id),
        system_code: String(system.system_code || ""),
        next_due_date: nextDueDate,
        state,
        days_diff: daysDiff,
      };
    })
    .filter(Boolean)
    .filter((item: any) => item.state !== "future");

  const systemOptions = systemsRef
    .filter((s) => String(s.enabled || "").toLowerCase() !== "false")
    .map((s) => ({
      system_code: String(s.system_code),
      system_name: String(s.system_name || s.system_code),
    }));

  return (
    <AppShell>
      <PageHeader
        title={String(facility?.facility_name || "المنشأة")}
        subtitle="ملف المنشأة والمباني والأنظمة والزيارات المرتبطة بها"
      />

      <div className="card">
        <div className="section-title">البيانات الأساسية</div>
        <div className="section-subtitle">
          {String(facility?.address || "لا يوجد عنوان مسجل")}
        </div>

        <div className="badge-wrap" style={{ marginTop: "12px" }}>
          {facility?.city ? <span className="badge">{facility.city}</span> : null}
          {facility?.district ? <span className="badge">{facility.district}</span> : null}
          {facility?.occupancy_classification ? (
            <span className="badge">{facility.occupancy_classification}</span>
          ) : null}
          {facility?.contact_person ? (
            <span className="badge">{facility.contact_person}</span>
          ) : null}
          {facility?.contact_phone ? (
            <span className="badge">{facility.contact_phone}</span>
          ) : null}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="المباني"
          value={facilityBuildings.length}
          hint="إجمالي المباني التابعة"
          icon={Building2}
          tone="teal"
        />
        <StatCard
          label="الأنظمة"
          value={facilityBuildingSystems.length}
          hint="إجمالي الأنظمة المثبتة"
          icon={Wrench}
          tone="slate"
        />
        <StatCard
          label="العناصر المستحقة"
          value={dueSystems.length}
          hint="المتأخر واليوم والقريب"
          icon={ClipboardList}
          tone={dueSystems.length > 0 ? "amber" : "slate"}
        />
        <StatCard
          label="المخالفات المفتوحة"
          value={openFindingsCount}
          hint="تحتاج متابعة"
          icon={ShieldAlert}
          tone={openFindingsCount > 0 ? "red" : "slate"}
        />
      </div>

      <CreateVisitForm
        facilities={[
          {
            facility_id: String(facility?.facility_id || ""),
            facility_name: String(facility?.facility_name || "Facility"),
          },
        ]}
        buildings={facilityBuildings.map((b) => ({
          building_id: String(b.building_id),
          facility_id: String(b.facility_id),
          building_name: String(b.building_name),
        }))}
        buildingSystems={facilityBuildingSystems.map((s) => ({
          building_system_id: String(s.building_system_id),
          building_id: String(s.building_id),
          system_code: String(s.system_code),
        }))}
        inspectors={inspectors.map((i) => ({
          inspector_id: String(i.inspector_id),
          inspector_name: String(
            i.inspector_name || i.full_name || i.email || i.inspector_id
          ),
        }))}
      />

      <AddBuildingForm
        facilities={[
          {
            facility_id: String(facility?.facility_id || ""),
            facility_name: String(facility?.facility_name || "Facility"),
          },
        ]}
        systems={systemOptions}
      />

      <AddSystemForm
        buildings={facilityBuildings.map((b) => ({
          building_id: String(b.building_id),
          building_name: String(b.building_name),
        }))}
        systems={systemOptions}
      />

      <section className="card">
        <div className="section-title">المباني والأنظمة</div>

        {facilityBuildings.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد مبانٍ"
              description="ابدأ بإضافة أول مبنى لهذه المنشأة من النموذج أعلاه."
              icon={Building2}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {facilityBuildings.map((building) => {
              const systemsForBuilding = facilityBuildingSystems.filter(
                (s) => String(s.building_id) === String(building.building_id)
              );

              const dueForBuilding = dueSystems.filter(
                (d: any) => String(d.building_id) === String(building.building_id)
              );

              return (
                <div key={String(building.building_id)} className="building-block">
                  <div className="building-block-top">
                    <div>
                      <div className="building-block-title">
                        {String(building.building_name || "مبنى")}
                      </div>
                      <div className="building-block-sub">
                        {String(building.building_use || "-")} · Floors:{" "}
                        {String(building.number_of_floors || "1")}
                      </div>
                    </div>

                    <div className="badge-wrap">
                      <span className="badge">
                        الأنظمة: {systemsForBuilding.length}
                      </span>
                      <span className="badge">
                        المستحق: {dueForBuilding.length}
                      </span>
                    </div>
                  </div>

                  <div className="building-block-section">
                    <div className="building-block-section-title">
                      الأنظمة المثبتة
                    </div>

                    {systemsForBuilding.length === 0 ? (
                      <div className="muted-note">لا توجد أنظمة مرتبطة بهذا المبنى.</div>
                    ) : (
                      <div className="badge-wrap">
                        {systemsForBuilding.map((s) => (
                          <span key={String(s.building_system_id)} className="badge">
                            {String(s.system_code)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="building-block-section">
                    <div className="building-block-section-title">
                      العناصر المستحقة لهذا المبنى
                    </div>

                    {dueForBuilding.length === 0 ? (
                      <div className="muted-note">
                        لا توجد عناصر مستحقة حاليًا لهذا المبنى.
                      </div>
                    ) : (
                      <div className="stack-3">
                        {dueForBuilding.map((item: any) => (
                          <div
                            key={`${item.building_system_id}-${item.next_due_date}`}
                            className="system-line"
                          >
                            <div className="system-line-top">
                              <div>
                                <div className="system-line-title">
                                  {item.system_code}
                                </div>
                                <div className="system-line-date">
                                  الاستحقاق: {item.next_due_date}
                                </div>
                              </div>

                              <DueStateBadge state={item.state} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-title">آخر الزيارات لهذه المنشأة</div>

        {facilityVisits.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد زيارات"
              description="بعد إنشاء زيارة جديدة لهذه المنشأة ستظهر هنا."
              icon={ClipboardList}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {facilityVisits.slice(0, 5).map((visit) => {
              const building = facilityBuildings.find(
                (b) => String(b.building_id) === String(visit.building_id)
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
      </section>

      <section className="card">
        <div className="section-title">آخر المخالفات لهذه المنشأة</div>

        {facilityFindings.length === 0 ? (
          <div style={{ marginTop: "12px" }}>
            <EmptyState
              title="لا توجد مخالفات"
              description="عند تسجيل بنود غير مطابقة داخل زيارات هذه المنشأة ستظهر هنا."
              icon={ShieldAlert}
            />
          </div>
        ) : (
          <div className="stack-3" style={{ marginTop: "12px" }}>
            {facilityFindings.slice(0, 5).map((finding) => {
              const visitSystem = facilityVisitSystems.find(
                (vs) =>
                  String(vs.visit_system_id) === String(finding.visit_system_id)
              );

              const visit = facilityVisits.find(
                (v) => String(v.visit_id) === String(visitSystem?.visit_id || "")
              );

              const building = facilityBuildings.find(
                (b) => String(b.building_id) === String(visit?.building_id || "")
              );

              return (
                <FindingCard
                  key={String(finding.finding_id)}
                  finding={finding}
                  facilityName={String(facility?.facility_name || "")}
                  buildingName={String(building?.building_name || "")}
                  systemCode={String(visitSystem?.system_code || "")}
                />
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
