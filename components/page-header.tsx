export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      {subtitle ? (
        <div className="mb-2 text-xs font-medium leading-5 text-slate-500">
          {subtitle}
        </div>
      ) : null}

      <h1 className="text-2xl font-extrabold leading-9 text-slate-900 sm:text-3xl">
        {title}
      </h1>
    </div>
  );
}
