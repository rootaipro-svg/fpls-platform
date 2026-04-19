type PageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  chips?: Array<string>;
};

export function PageHero({
  eyebrow = "",
  title,
  subtitle = "",
  chips = [],
}: PageHeroProps) {
  return (
    <section className="mb-4 rounded-[28px] border border-slate-200 bg-white px-5 py-6 shadow-sm">
      {eyebrow ? (
        <div className="mb-2 text-sm font-medium text-slate-500">{eyebrow}</div>
      ) : null}

      <h1 className="text-4xl font-extrabold leading-tight text-slate-950">
        {title}
      </h1>

      {subtitle ? (
        <div className="mt-3 text-base leading-8 text-slate-500">{subtitle}</div>
      ) : null}

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
