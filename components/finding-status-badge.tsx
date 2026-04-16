export function FindingStatusBadge({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();

  let className = "finding-status-badge finding-status-badge--default";
  let label = status || "غير محدد";

  if (normalized === "open") {
    className = "finding-status-badge finding-status-badge--open";
    label = "مفتوحة";
  } else if (normalized === "closed") {
    className = "finding-status-badge finding-status-badge--closed";
    label = "مغلقة";
  }

  return <span className={className}>{label}</span>;
}
