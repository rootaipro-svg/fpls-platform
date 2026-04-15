import { addDays, addMonths, addWeeks, addYears, formatISO } from "date-fns";

export function nowIso() {
  return formatISO(new Date());
}

export function addByUnit(date: Date, value: number, unit: string) {
  switch (unit) {
    case "day":
    case "days":
      return addDays(date, value);
    case "week":
    case "weeks":
      return addWeeks(date, value);
    case "month":
    case "months":
      return addMonths(date, value);
    case "year":
    case "years":
      return addYears(date, value);
    default:
      return date;
  }
}
