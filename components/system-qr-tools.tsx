"use client";

import { useState } from "react";
import { Copy, Download, Printer } from "lucide-react";

type Props = {
  qrUrl: string;
  qrDataUrl: string;
  label: string;
  arName: string;
  enName: string;
  code: string;
  standard: string;
  facilityName: string;
  buildingName: string;
  locationText: string;
};

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function SystemQrTools({
  qrUrl,
  qrDataUrl,
  label,
  arName,
  enName,
  code,
  standard,
  facilityName,
  buildingName,
  locationText,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function printLabel() {
    const printWindow = window.open("", "_blank", "width=520,height=760");

    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${escapeHtml(label)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, Tahoma, sans-serif;
              background: #f1f5f9;
              color: #0f172a;
            }
            .label {
              width: 95mm;
              min-height: 125mm;
              margin: 0 auto;
              background: white;
              border: 2px solid #0f766e;
              border-radius: 18px;
              padding: 18px;
              text-align: center;
            }
            .brand {
              font-size: 13px;
              font-weight: 800;
              color: #0f766e;
              margin-bottom: 10px;
            }
            .title {
              font-size: 22px;
              font-weight: 900;
              line-height: 1.45;
              margin: 10px 0 4px;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              line-height: 1.5;
              margin-bottom: 10px;
            }
            .qr {
              width: 210px;
              height: 210px;
              margin: 12px auto;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 10px;
            }
            .qr img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .meta {
              margin-top: 12px;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
              text-align: right;
              font-size: 12px;
              line-height: 1.8;
              color: #334155;
            }
            .scan {
              margin-top: 14px;
              display: inline-block;
              background: #0f766e;
              color: white;
              border-radius: 999px;
              padding: 8px 14px;
              font-size: 12px;
              font-weight: 800;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .label {
                margin: 0;
                width: 95mm;
                min-height: 125mm;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="brand">FPLS Inspection Platform</div>
            <div class="qr">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="title">${escapeHtml(arName)}</div>
            <div class="subtitle">${escapeHtml(enName)}</div>
            <div class="subtitle">${escapeHtml(code)}${standard ? " · " + escapeHtml(standard) : ""}</div>

            <div class="meta">
              <div><strong>المنشأة:</strong> ${escapeHtml(facilityName)}</div>
              <div><strong>المبنى:</strong> ${escapeHtml(buildingName)}</div>
              <div><strong>الموقع:</strong> ${escapeHtml(locationText || "—")}</div>
              <div><strong>الرابط:</strong> ${escapeHtml(qrUrl)}</div>
            </div>

            <div class="scan">امسح الكود لفتح النظام وبدء الفحص</div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "8px",
        marginTop: "12px",
      }}
    >
      <a
        className="btn"
        href={qrDataUrl}
        download={`${code || "system"}-qr.png`}
        style={{ justifyContent: "center" }}
      >
        <Download size={18} />
        تنزيل QR كصورة
      </a>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={printLabel}
        style={{ justifyContent: "center" }}
      >
        <Printer size={18} />
        طباعة ملصق QR
      </button>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={copyLink}
        style={{ justifyContent: "center" }}
      >
        <Copy size={18} />
        {copied ? "تم نسخ الرابط" : "نسخ رابط النظام"}
      </button>
    </div>
  );
}
