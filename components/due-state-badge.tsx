export function DueStateBadge({ state }: { state: string }) {
  const normalized = String(state || "").toLowerCase();

  let className = "due-state-badge due-state-badge--future";
  let label = "لاحقًا";

  if (normalized === "overdue") {
    className = "due-state-badge due-state-badge--overdue";
    label = "متأخر";
  } else if (normalized === "today") {
    className = "due-state-badge due-state-badge--today";
    label = "اليوم";
  } else if (normalized === "soon") {
    className = "due-state-badge due-state-badge--soon";
    label = "قريب";
  }

  return <span className={className}>{label}</span>;
}
