import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function ScanAssetEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await getSessionUser();
    redirect(`/assets/${String(id)}`);
  } catch {
    redirect(`/login?next=${encodeURIComponent(`/assets/${String(id)}`)}`);
  }
}
