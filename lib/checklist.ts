import { readSheet } from "./sheets";

export async function getChecklistForSystem(spreadsheetId: string, systemCode: string) {
  const items = await readSheet(spreadsheetId, "CHECKLIST_TEMPLATES");
  return items
    .filter((i) => String(i.system_code) === systemCode && String(i.enabled).toLowerCase() !== "false")
    .sort((a, b) => Number(a.item_order) - Number(b.item_order));
}
