export function StatusBadge({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();

  let className = "status-badge status-badge--default";
  let label = status || "unknown";

  if (normalized === "planned") {
    className = "status-badge status-badge--planned";
    label = "مجدولة";
  } else if (normalized === "in_progress" || normalized === "in-progress") {
    className = "status-badge status-badge--progress";
    label = "قيد التنفيذ";
  } else if (normalized === "closed" || normalized === "completed") {
    className = "status-badge status-badge--closed";
    label = "مغلقة";
  }

  return <span className={className}>{label}</span>;
}
