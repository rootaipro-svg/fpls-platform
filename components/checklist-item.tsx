export function ChecklistItem({ item }: { item: any }) {
  return (
    <div className="card">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{item.section_name}</div>
      <div className="text-sm font-semibold">{item.question_text}</div>
      <div className="mt-2 text-xs text-slate-500">{item.acceptance_criteria}</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button className="btn btn-secondary">Pass</button>
        <button className="btn btn-secondary">Fail</button>
        <button className="btn btn-secondary">N/A</button>
      </div>
    </div>
  );
}
