export function SeverityBadge({ severity }: { severity: string }) {
  const normalized = String(severity || "").toLowerCase();

  let className = "severity-pill severity-pill--default";
  let label = severity || "غير محدد";

  if (normalized === "critical") {
    className = "severity-pill severity-pill--critical";
    label = "حرج";
  } else if (normalized === "major") {
    className = "severity-pill severity-pill--major";
    label = "مرتفع";
  } else if (normalized === "minor") {
    className = "severity-pill severity-pill--minor";
    label = "منخفض";
  }

  return <span className={className}>{label}</span>;
}
