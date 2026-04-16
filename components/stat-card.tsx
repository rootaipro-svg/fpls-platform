import { LucideIcon } from "lucide-react";

type Tone = "teal" | "amber" | "red" | "slate";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {hint ? <div className="stat-hint">{hint}</div> : null}
        </div>

        {Icon ? (
          <div className={`stat-icon stat-icon--${tone}`}>
            <Icon size={20} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
