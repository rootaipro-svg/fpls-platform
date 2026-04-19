import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type ActionCardProps = {
  href: string;
  title: string;
  text: string;
  buttonLabel: string;
  icon: LucideIcon;
};

export function ActionCard({
  href,
  title,
  text,
  buttonLabel,
  icon: Icon,
}: ActionCardProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="text-right">
          <div className="text-3xl font-extrabold text-slate-950">{title}</div>
          <div className="mt-3 text-base leading-8 text-slate-500">{text}</div>
        </div>

        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-teal-600 text-white shadow-sm">
          <Icon size={34} />
        </div>
      </div>

      <Link
        href={href}
        className="flex items-center justify-center rounded-[24px] bg-teal-600 px-5 py-4 text-lg font-bold text-white shadow-sm transition hover:bg-teal-700"
      >
        {buttonLabel}
      </Link>
    </section>
  );
}
