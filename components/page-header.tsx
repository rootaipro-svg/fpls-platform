export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="page-header-card">
      {subtitle ? <div className="page-header-subtitle">{subtitle}</div> : null}
      <h1 className="page-header-title">{title}</h1>
    </div>
  );
}
