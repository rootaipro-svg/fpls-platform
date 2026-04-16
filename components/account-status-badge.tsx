export function AccountStatusBadge({ status }: { status: string }) {
  const normalized = String(status || "").toLowerCase();

  let className = "account-badge account-badge--default";
  let label = status || "unknown";

  if (normalized === "active") {
    className = "account-badge account-badge--active";
    label = "نشط";
  } else if (
    normalized === "disabled" ||
    normalized === "inactive" ||
    normalized === "blocked"
  ) {
    className = "account-badge account-badge--disabled";
    label = "معطل";
  }

  return <span className={className}>{label}</span>;
}
