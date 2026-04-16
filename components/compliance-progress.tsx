export function ComplianceProgress({ value }: { value: number | string }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="compliance-progress-wrap">
      <div className="compliance-progress-bar">
        <div
          className="compliance-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="compliance-progress-text">نسبة الامتثال: {percent}%</div>
    </div>
  );
}
