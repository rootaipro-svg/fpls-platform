type EvidenceRow = {
  evidence_id: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  caption: string;
  taken_by: string;
  taken_at: string;
};

function looksLikeImage(url: string, evidenceType: string) {
  const u = String(url || "").toLowerCase();
  if (String(evidenceType || "").toLowerCase() === "image") return true;

  return (
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".png") ||
    u.endsWith(".webp") ||
    u.includes("blob.vercel-storage.com")
  );
}

export default function FindingEvidenceList({
  rows,
}: {
  rows: EvidenceRow[];
}) {
  return (
    <section className="card">
      <div className="section-title">أدلة المخالفة</div>
      <div className="section-subtitle">
        الصور والمرفقات المرتبطة بهذه المخالفة
      </div>

      {rows.length === 0 ? (
        <div className="muted-note" style={{ marginTop: "14px" }}>
          لا توجد أدلة مرتبطة بهذه المخالفة حتى الآن.
        </div>
      ) : (
        <div className="stack-3" style={{ marginTop: "14px" }}>
          {rows.map((row) => (
            <div
              key={row.evidence_id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "14px",
                background: "#ffffff",
              }}
            >
              <div className="badge-wrap">
                <span className="badge">{row.evidence_type || "evidence"}</span>
                {row.file_name ? <span className="badge">{row.file_name}</span> : null}
              </div>

              {looksLikeImage(row.file_url, row.evidence_type) ? (
                <div style={{ marginTop: "12px" }}>
                  <img
                    src={row.file_url}
                    alt={row.file_name || "Evidence"}
                    style={{
                      width: "100%",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </div>
              ) : null}

              {row.caption ? (
                <div className="visit-card-text" style={{ marginTop: "12px" }}>
                  {row.caption}
                </div>
              ) : null}

              <div className="section-subtitle" style={{ marginTop: "8px" }}>
                {row.taken_by || "غير محدد"}
                {row.taken_at ? ` · ${row.taken_at}` : ""}
              </div>

              <div style={{ marginTop: "12px" }}>
                <a
                  href={row.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  فتح الدليل
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
