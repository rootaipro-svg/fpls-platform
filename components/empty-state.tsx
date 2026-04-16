import { LucideIcon } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="empty-state">
      {Icon ? (
        <div className="empty-state-icon">
          <Icon size={24} />
        </div>
      ) : null}

      <div className="empty-state-title">{title}</div>
      <div className="empty-state-text">{description}</div>
    </div>
  );
}
