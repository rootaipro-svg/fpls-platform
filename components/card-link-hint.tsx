import { ArrowUpLeft } from "lucide-react";

export function CardLinkHint({ label }: { label: string }) {
  return (
    <div className="card-link-row">
      <span className="card-link-text">{label}</span>
      <span className="card-link-icon">
        <ArrowUpLeft size={16} />
      </span>
    </div>
  );
}
