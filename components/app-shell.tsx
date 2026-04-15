import Link from "next/link";
import { Building2, ClipboardList, Home, UserCircle2 } from "lucide-react";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page-wrap">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Field inspection platform</div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <UserCircle2 className="h-8 w-8 text-slate-500" />
      </div>

      <div className="space-y-4">{children}</div>

      <nav className="fixed bottom-4 left-1/2 w-[calc(100%-32px)] max-w-[688px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Link href="/dashboard" className="rounded-xl p-2"><Home className="mx-auto mb-1 h-5 w-5" />Home</Link>
          <Link href="/facilities" className="rounded-xl p-2"><Building2 className="mx-auto mb-1 h-5 w-5" />Facilities</Link>
          <Link href="/visits" className="rounded-xl p-2"><ClipboardList className="mx-auto mb-1 h-5 w-5" />Visits</Link>
        </div>
      </nav>
    </div>
  );
}
