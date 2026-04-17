import Link from "next/link";
import QRCode from "qrcode";
import { headers } from "next/headers";
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
    <div className="labels-page-wrap" dir="rtl">
      <div className="labels-toolbar print-hidden">
        <PageHeader
          title="ملصقات QR للأصول"
          subtitle="صفحة جاهزة للطباعة والقص واللصق على الأصول والمعدات"
        />

        <div className="card">
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
      </div>

      <div className="asset-labels-print-grid">
        {labelRows.map((row) => (
          <div key={row.asset_id} className="asset-label-card">
            <div className="asset-label-title">
              {row.asset_name_ar || row.asset_name || "أصل"}
            </div>

            <div className="asset-label-code">{row.asset_code}</div>

            <div className="asset-label-badges">
              <span className="badge">{row.system_code}</span>
              <span className="badge">{row.status}</span>
            </div>

            <div className="asset-label-qr-wrap">
              <img
                src={row.qrDataUrl}
                alt={`QR-${row.asset_code}`}
                className="asset-label-qr"
              />
            </div>

            <div className="asset-label-id">{row.asset_id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
