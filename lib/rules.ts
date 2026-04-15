import { readSheet } from "./sheets";

export async function getApplicableRules(spreadsheetId: string, systemCode: string, occupancyProfileId?: string, riskProfileId?: string, authorityProfileId?: string) {
  const rules = await readSheet(spreadsheetId, "FREQUENCY_RULES");
  return rules.filter((r) => {
    if (String(r.system_code) !== systemCode) return false;
    if (String(r.enabled || "true") === "false") return false;

    const occupancyOk = !r.occupancy_condition || String(r.occupancy_condition) === occupancyProfileId || String(r.occupancy_condition) === "";
    const riskOk = !r.risk_condition || String(r.risk_condition) === riskProfileId || String(r.risk_condition) === "";
    const authorityOk = !r.authority_condition || String(r.authority_condition) === authorityProfileId || String(r.authority_condition) === "";
    return occupancyOk && riskOk && authorityOk;
  });
}
