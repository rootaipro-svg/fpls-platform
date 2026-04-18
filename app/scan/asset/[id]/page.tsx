import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getTenantWorkbookId } from "@/lib/tenant";
import { readSheet } from "@/lib/sheets";
import {
  getCurrentInspector,
  isVisitAssignedToInspector,
} from "@/lib/current-inspector";

function parseAllowedSystems(value: any) {
  return String(value || "")
    .split(/[,;|\n،]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function sortVisitsDesc(rows: any[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(
      String(a?.planned_date || a?.visit_date || a?.updated_at || 0)
    ).getTime();

    const bTime = new Date(
      String(b?.planned_date || b?.visit_date || b?.updated_at || 0)
    ).getTime();

    return bTime - aTime;
  });
}

export default async function ScanAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: any = null;

  try {
    user = await getSessionUser();
  } catch {
    user = null;
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/scan/asset/${String(id)}`)}`);
  }

  const workbookId = await getTenantWorkbookId(user.tenantId);

  const [assets, visits, visitSystems] = await Promise.all([
    readSheet(workbookId, "ASSETS"),
    readSheet(workbookId, "VISITS"),
    readSheet(workbookId, "VISIT_SYSTEMS"),
  ]);

  const asset = assets.find(
    (row) => String(row.asset_id || "") === String(id)
  );

  if (!asset) {
    redirect("/assets");
  }

  let currentInspector: any = null;

  if (String(user.role || "").toLowerCase() === "inspector") {
    currentInspector = await getCurrentInspector(workbookId, user);

    if (!currentInspector) {
      redirect(`/assets/${String(id)}`);
    }

    const allowedSystems = parseAllowedSystems(currentInspector.allowed_systems);
    const canAccess =
      allowedSystems.includes("*") ||
      allowedSystems.includes(String(asset.system_code || ""));

    if (!canAccess) {
      redirect(`/assets/${String(id)}`);
    }
  }

  const relatedVisitSystems = visitSystems.filter(
    (row) =>
      String(row.building_system_id || "") ===
      String(asset.building_system_id || "")
  );

  const relatedVisitIds = new Set(
    relatedVisitSystems.map((row) => String(row.visit_id || ""))
  );

  const relatedVisits = sortVisitsDesc(
    visits.filter((row) => relatedVisitIds.has(String(row.visit_id || "")))
  );

  const executionVisit =
    String(user.role || "").toLowerCase() === "inspector" && currentInspector
      ? relatedVisits.find(
          (row) =>
            String(row.visit_status || "").toLowerCase() !== "closed" &&
            isVisitAssignedToInspector(
              row,
              String(currentInspector.inspector_id || "")
            )
        )
      : relatedVisits.find(
          (row) => String(row.visit_status || "").toLowerCase() !== "closed"
        );

  if (executionVisit) {
    redirect(
      `/visits/${String(executionVisit.visit_id)}?asset_id=${encodeURIComponent(
        String(id)
      )}`
    );
  }

  redirect(`/assets/${String(id)}`);
}
