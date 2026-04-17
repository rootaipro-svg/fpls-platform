import Link from "next/link";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import PrintPageButton from "@/components/print-page-button";
import { requirePermission } from "@/lib/permissions";
import { readSheet } from "@/lib/sheets";

type LabelRow = {
  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_name_ar: string;
  system_code: string;
  status: string;
  qrDataUrl: string;
};

export default async function AssetLabelsPage() {
  const actor = await requirePermission("facilities", "view");
  const workbookId = actor.workbookId;

  const assets = await readSheet(workbookId, "ASSETS");

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const host =
    hdrs.get("x-forwarded-host") ||
    hdrs.get("host") ||
    "fpls-platform.vercel.app";

  const baseUrl = `${proto}://${host}`;

  const activeAssets = assets
    .filter(
      (row) => String(row.status || "active").toLowerCase() !== "inactive"
    )
    .sort((a, b) =>
      String(a.asset_name_ar || a.asset_name || a.asset_code || "").localeCompare(
        String(b.asset_name_ar || b.asset_name || b.asset_code || ""),
        "ar"
      )
    );

  const labelRows: LabelRow[] = await Promise.all(
    activeAssets.map(async (asset) => {
      const absoluteScanUrl = `${baseUrl}/scan/asset/${String(
        asset.asset_id || ""
      )}`;

      const qrDataUrl = await QRCode.toDataURL(absoluteScanUrl, {
        width: 220,
        margin: 1,
      });

      return {
        asset_id: String(asset.asset_id || ""),
        asset_code: String(asset.asset_code || asset.asset_id || "-"),
        asset_name: String(asset.asset_name || ""),
        asset_name_ar: String(asset.asset_name_ar || ""),
        system_code: String(asset.system_code || "-"),
        status: String(asset.status || "active"),
        qrDataUrl,
      };
    })
  );

  return (
    <AppShell>
      <PageHeader
        title="ملصقات QR للأصول"
        subtitle="صفحة جاهزة للطباعة والقص واللصق على الأصول والمعدات"
      />

      <div className="card print-hidden">
        <div className="section-title">تعليمات الطباعة</div>
        <div className="section-subtitle">
          اطبع هذه الصفحة من المتصفح، وسيتم إنشاء رموز QR كاملة تفتح الأصل بعد
          المسح مباشرة.
        </div>

        <div className="btn-row" style={{ marginTop: "16px" }}>
          <Link href="/assets" className="btn btn-secondary">
            العودة للأصول
          </Link>

          <PrintPageButton label="طباعة الملصقات" className="btn" />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {labelRows.map((row) => (
          <div
            key={row.asset_id}
            className="card"
            style={{
              textAlign: "center",
              breakInside: "avoid",
              pageBreakInside: "avoid",
              minHeight: "360px",
            }}
          >
            <div className="section-title" style={{ fontSize: "18px" }}>
              {row.asset_name_ar || row.asset_name || "أصل"}
            </div>

            <div className="section-subtitle" style={{ marginTop: "6px" }}>
              {row.asset_code}
            </div>

            <div
              className="badge-wrap"
              style={{ justifyContent: "center", marginTop: "10px" }}
            >
              <span className="badge">{row.system_code}</span>
              <span className="badge">{row.status}</span>
            </div>

            <div style={{ marginTop: "18px" }}>
              <img
                src={row.qrDataUrl}
                alt={`QR-${row.asset_code}`}
                style={{
                  width: "220px",
                  height: "220px",
                  margin: "0 auto",
                  display: "block",
                  background: "#fff",
                  borderRadius: "14px",
                  padding: "8px",
                  border: "1px solid #e2e8f0",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#64748b",
                wordBreak: "break-word",
              }}
            >
              {row.asset_id}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
