export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {subtitle ? (
            <div className="mb-1 text-xs font-medium text-slate-500">{subtitle}</div>
          ) : null}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
