type EvidenceRow = {
  evidence_id: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  caption: string;
  taken_by: string;
  taken_at: string;
  visit_system_id?: string;
  finding_id?: string;
};

function looksLikeImage(url: string, evidenceType: string) {
  const u = String(url || "").toLowerCase();
  if (String(evidenceType || "").toLowerCase() === "image") return true;
  return (
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".png") ||
    u.endsWith(".webp") ||
    u.includes("drive.google.com") ||
    u.includes("googleusercontent.com")
  );
}

export default function VisitEvidenceList({
  rows,
}: {
  rows: EvidenceRow[];
}) {
  return (
    <div className="card">
      <div className="section-title">الأدلة المسجلة</div>
      <div className="section-subtitle">
        الصور والروابط والمرفقات المرتبطة بهذه الزيارة
      </div>

      {rows.length === 0 ? (
        <div className="muted-note" style={{ marginTop: "14px" }}>
          لا توجد أدلة مسجلة لهذه الزيارة حتى الآن.
        </div>
      ) : (
        <div className="stack-3" style={{ marginTop: "14px" }}>
          {rows.map((row) => (
            <div key={row.evidence_id} className="building-block">
              <div className="building-block-top">
                <div>
                  <div className="building-block-title">
                    {row.file_name || row.evidence_type || "دليل"}
                  </div>
                  <div className="building-block-sub">
                    {row.taken_by || "غير محدد"}
                    {row.taken_at ? ` · ${row.taken_at}` : ""}
                  </div>
                </div>

                <div className="badge-wrap">
                  <span className="badge">{row.evidence_type || "evidence"}</span>
                  {row.finding_id ? <span className="badge">مخالفة</span> : null}
                  {row.visit_system_id ? <span className="badge">نظام</span> : null}
                </div>
              </div>

              {looksLikeImage(row.file_url, row.evidence_type) ? (
                <div style={{ marginTop: "12px" }}>
                  <img
                    src={row.file_url}
                    alt={row.file_name || "Evidence"}
                    style={{
                      width: "100%",
                      borderRadius: "16px",
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
    </div>
  );
}
