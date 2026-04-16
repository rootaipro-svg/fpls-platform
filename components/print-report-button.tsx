"use client";

export default function PrintReportButton() {
  return (
    <button
      type="button"
      className="btn"
      onClick={() => window.print()}
    >
      طباعة / حفظ PDF
    </button>
  );
}
