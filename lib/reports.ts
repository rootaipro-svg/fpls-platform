import { readSheet } from "./sheets";

export async function buildVisitReportModel(spreadsheetId: string, visitId: string) {
  const [visits, facilities, buildings, visitSystems, findings, evidence] = await Promise.all([
    readSheet(spreadsheetId, "VISITS"),
    readSheet(spreadsheetId, "FACILITIES"),
    readSheet(spreadsheetId, "BUILDINGS"),
    readSheet(spreadsheetId, "VISIT_SYSTEMS"),
    readSheet(spreadsheetId, "FINDINGS"),
    readSheet(spreadsheetId, "EVIDENCE")
  ]);

  const visit = visits.find(v => String(v.visit_id) === visitId);
  if (!visit) throw new Error("Visit not found");

  const facility = facilities.find(f => String(f.facility_id) === String(visit.facility_id));
  const building = buildings.find(b => String(b.building_id) === String(visit.building_id));
  const systems = visitSystems.filter(vs => String(vs.visit_id) === visitId);
  const visitSystemIds = new Set(systems.map(s => String(s.visit_system_id)));
  const reportFindings = findings.filter(f => visitSystemIds.has(String(f.visit_system_id)));
  const reportEvidence = evidence.filter(e => String(e.visit_id) === visitId);

  return { visit, facility, building, systems, reportFindings, reportEvidence };
}
