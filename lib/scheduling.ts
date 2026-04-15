import { addByUnit } from "./dates";
import { getApplicableRules } from "./rules";
import { readSheet } from "./sheets";

export async function calculateNextDueForVisitSystem(spreadsheetId: string, visitSystemId: string) {
  const visitSystems = await readSheet(spreadsheetId, "VISIT_SYSTEMS");
  const visits = await readSheet(spreadsheetId, "VISITS");
  const buildingSystems = await readSheet(spreadsheetId, "BUILDING_SYSTEMS");
  const buildings = await readSheet(spreadsheetId, "BUILDINGS");

  const visitSystem = visitSystems.find(v => String(v.visit_system_id) === visitSystemId);
  if (!visitSystem) throw new Error("Visit system not found");

  const visit = visits.find(v => String(v.visit_id) === String(visitSystem.visit_id));
  const buildingSystem = buildingSystems.find(s => String(s.building_system_id) === String(visitSystem.building_system_id));
  const building = buildings.find(b => String(b.building_id) === String(buildingSystem?.building_id));

  if (!visit || !buildingSystem || !building) throw new Error("Scheduling context incomplete");

  const rules = await getApplicableRules(
    spreadsheetId,
    String(visitSystem.system_code),
    String(building.occupancy_profile_id || ""),
    String(building.risk_profile_id || ""),
    String(buildingSystem.authority_profile_id || "")
  );

  if (!rules.length) return null;

  const anchor = new Date(String(visit.visit_date || visit.due_date || visit.planned_date));
  const shortestRule = rules.sort((a, b) => Number(a.frequency_value) - Number(b.frequency_value))[0];
  const due = addByUnit(anchor, Number(shortestRule.frequency_value), String(shortestRule.frequency_unit));
  return due.toISOString().slice(0, 10);
}
