import Link from "next/link";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

export default async function AssetQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requirePermission("facilities", "view");
  const workbookId = actor.workbookId;

  const assets = await readSheet(workbookId, "ASSETS");
  const asset = assets.find((row) => String(row.asset_id) === String(id));

  if (!asset) {
    return (
      <AppShell>
        <PageHeader title="QR الأصل" subtitle={`الأصل: ${String(id)}`} />
        <EmptyState
          title="الأصل غير موجود"
          description="تعذر العثور على الأصل المطلوب."
        />
      </AppShell>
    );
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const scanUrl = host
    ? `${proto}://${host}/scan/asset/${String(id)}`
    : `/scan/asset/${String(id)}`;

  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 320,
    margin: 2,
  });

  return (
    <AppShell>
      <PageHeader
        title="رمز QR للأصل"
        subtitle={String(asset.asset_name_ar || asset.asset_name || "أصل")}
      />

      <section className="card" style={{ textAlign: "center" }}>
        <div className="section-title">QR</div>
        <div className="section-subtitle">
          عند مسح هذا الرمز سيتم فتح الأصل مباشرة بعد التحقق من تسجيل الدخول.
        </div>

        <div style={{ marginTop: "20px" }}>
          <img
            src={qrDataUrl}
            alt="Asset QR"
            style={{
              width: "100%",
              maxWidth: "320px",
              margin: "0 auto",
              display: "block",
              borderRadius: "16px",
              background: "#fff",
              padding: "12px",
              border: "1px solid #e2e8f0",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "16px",
            wordBreak: "break-all",
            fontSize: "14px",
            color: "#475569",
          }}
        >
          {scanUrl}
        </div>

        <div
          style={{
            marginTop: "10px",
            wordBreak: "break-all",
            fontSize: "13px",
            color: "#64748b",
          }}
        >
          المعرّف الداخلي: {String(asset.qr_code_value || "-")}
        </div>

        <div className="btn-row" style={{ marginTop: "16px" }}>
          <Link href={`/assets/${id}`} className="btn btn-secondary">
            العودة للأصل
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
