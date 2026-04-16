import { DueStateBadge } from "@/components/due-state-badge";
import CreateFollowupButton from "@/components/create-followup-button";

type Props = {
  item: {
    building_system_id: string;
    system_code: string;
    facility_name: string;
    building_name: string;
    next_due_date: string;
    state: string;
    days_diff: number;
  };
};

export function DueItemCard({ item }: Props) {
  return (
    <div className="due-card">
      <div className="due-card-top">
        <div>
          <div className="due-card-title">{item.system_code}</div>
          <div className="due-card-sub">
            {item.facility_name}
            {item.building_name ? ` · ${item.building_name}` : ""}
          </div>
        </div>

        <DueStateBadge state={item.state} />
      </div>

      <div className="due-card-meta">
        <span className="badge">الاستحقاق: {item.next_due_date || "-"}</span>
        <span className="badge">
          {item.state === "overdue"
            ? `متأخر ${Math.abs(item.days_diff)} يوم`
            : item.state === "today"
            ? "مستحق اليوم"
            : item.state === "soon"
            ? `خلال ${item.days_diff} يوم`
            : "لاحقًا"}
        </span>
      </div>

      <div className="followup-note">
        سيتم إنشاء زيارة متابعة جديدة مرتبطة بهذا النظام فقط.
      </div>

      <CreateFollowupButton
        buildingSystemId={item.building_system_id}
        nextDueDate={item.next_due_date}
      />
    </div>
  );
}
