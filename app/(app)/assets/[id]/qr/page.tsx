import Link from "next/link";
import QRCode from "qrcode";
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

  const qrValue = String(asset.qr_code_value || "");
  const qrDataUrl = await QRCode.toDataURL(qrValue, {
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
          يمكن طباعة هذه الصفحة أو حفظها كلصاقة للأصل.
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
          {qrValue}
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
