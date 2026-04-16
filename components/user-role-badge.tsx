export function UserRoleBadge({ role }: { role: string }) {
  const normalized = String(role || "").toLowerCase();

  let className = "role-badge role-badge--default";
  let label = role || "unknown";

  if (normalized === "admin") {
    className = "role-badge role-badge--admin";
    label = "Admin";
  } else if (normalized === "reviewer") {
    className = "role-badge role-badge--reviewer";
    label = "Reviewer";
  } else if (normalized === "inspector") {
    className = "role-badge role-badge--inspector";
    label = "Inspector";
  }

  return <span className={className}>{label}</span>;
}
