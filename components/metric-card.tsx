import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "red" | "slate";
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "slate",
}: MetricCardProps) {
  const tones = {
    teal: {
      box: "border-teal-100 bg-teal-50 text-teal-700",
      card: "border-slate-200 bg-white",
    },
    amber: {
      box: "border-amber-100 bg-amber-50 text-amber-700",
      card: "border-slate-200 bg-white",
    },
    red: {
      box: "border-rose-100 bg-rose-50 text-rose-700",
      card: "border-slate-200 bg-white",
    },
    slate: {
      box: "border-slate-200 bg-slate-50 text-slate-600",
      card: "border-slate-200 bg-white",
    },
  } as const;

  const theme = tones[tone];

  return (
    <section className={`rounded-[28px] border p-5 shadow-sm ${theme.card}`}>
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-3xl border ${theme.box}`}
        >
          <Icon size={28} />
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-2 text-6xl font-extrabold leading-none text-slate-950">
            {value}
          </div>
          <div className="mt-3 text-sm text-slate-500">{subtitle}</div>
        </div>
      </div>
    </section>
  );
}
