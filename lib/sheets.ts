import { getSheetsClient } from "./google-auth";
import { SheetRow } from "./types";

function columnToLetter(index: number) {
  let dividend = index;
  let columnName = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return columnName;
}

export async function readSheet(spreadsheetId: string, sheetName: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`
  });

  const values = res.data.values || [];
  if (!values.length) return [];

  const headers = values[0];
  return values.slice(1).filter(r => r.some(Boolean)).map((row) => {
    const obj: SheetRow = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
}

export async function appendRow(spreadsheetId: string, sheetName: string, row: SheetRow) {
  const sheets = getSheetsClient();
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:2`
  });
  const headers = existing.data.values?.[0] || [];
  const ordered = headers.map((h) => row[h] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [ordered] }
  });
}

export async function updateRowById(
  spreadsheetId: string,
  sheetName: string,
  idColumn: string,
  idValue: string,
  patch: SheetRow
) {
  const sheets = getSheetsClient();
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`
  });
  const values = data.data.values || [];
  if (values.length < 2) throw new Error(`No rows found in ${sheetName}`);

  const headers = values[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) throw new Error(`Column ${idColumn} not found in ${sheetName}`);

  const rowIndex = values.findIndex((row, i) => i > 0 && row[idIndex] === idValue);
  if (rowIndex === -1) throw new Error(`${idValue} not found in ${sheetName}`);

  const current = values[rowIndex];
  const updated = headers.map((h, i) => (patch[h] !== undefined ? String(patch[h] ?? "") : current[i] ?? ""));
  const rowNumber = rowIndex + 1;
  const endColumn = columnToLetter(headers.length);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${rowNumber}:${endColumn}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [updated] }
  });
}
