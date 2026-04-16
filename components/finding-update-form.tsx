"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  finding: any;
};

export default function FindingUpdateForm({ finding }: Props) {
  const router = useRouter();

  const [correctiveAction, setCorrectiveAction] = useState(
    String(finding.corrective_action || "")
  );
  const [responsibleParty, setResponsibleParty] = useState(
    String(finding.responsible_party || "")
  );
  const [targetCloseDate, setTargetCloseDate] = useState(
    String(finding.target_close_date || "")
  );
  const [verificationNotes, setVerificationNotes] = useState(
    String(finding.verification_notes || "")
  );

  const [savingPlan, setSavingPlan] = useState(false);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function savePlan() {
    setSavingPlan(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/findings/${finding.finding_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "plan",
          corrective_action: correctiveAction,
          responsible_party: responsibleParty,
          target_close_date: targetCloseDate,
          verification_notes: verificationNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ خطة المعالجة");
      }

      setMessage("تم حفظ خطة المعالجة بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ خطة المعالجة");
    } finally {
      setSavingPlan(false);
    }
  }

  async function closeFinding() {
    setClosing(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/findings/${finding.finding_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "close",
          corrective_action: correctiveAction,
          responsible_party: responsibleParty,
          target_close_date: targetCloseDate,
          verification_notes: verificationNotes,
          actual_close_date: new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر إغلاق المخالفة");
      }

      setMessage("تم إغلاق المخالفة بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر إغلاق المخالفة");
    } finally {
      setClosing(false);
    }
  }

  const isClosed =
    String(finding.closure_status || "").toLowerCase() === "closed";

  return (
    <div className="detail-card">
      <div className="section-title">إدارة المخالفة</div>
      <div className="section-subtitle">
        سجل الإجراء التصحيحي والمسؤول وتاريخ الإغلاق المستهدف، ثم أغلق المخالفة بعد التحقق
      </div>

      <div className="finding-actions" style={{ marginTop: "14px" }}>
        <div>
          <div className="detail-label">الإجراء التصحيحي</div>
          <textarea
            className="textarea"
            value={correctiveAction}
            onChange={(e) => setCorrectiveAction(e.target.value)}
            placeholder="أدخل الإجراء التصحيحي المطلوب"
          />
        </div>

        <div>
          <div className="detail-label">الجهة / الشخص المسؤول</div>
          <input
            className="field"
            value={responsibleParty}
            onChange={(e) => setResponsibleParty(e.target.value)}
            placeholder="اسم المسؤول"
          />
        </div>

        <div>
          <div className="detail-label">تاريخ الإغلاق المستهدف</div>
          <input
            type="date"
            className="field"
            value={targetCloseDate}
            onChange={(e) => setTargetCloseDate(e.target.value)}
          />
        </div>

        <div>
          <div className="detail-label">ملاحظات التحقق</div>
          <textarea
            className="textarea"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="ملاحظات التحقق أو المتابعة"
          />
        </div>
      </div>

      {message ? (
        <div className="alert-success" style={{ marginTop: "14px" }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="alert-error" style={{ marginTop: "14px" }}>
          {error}
        </div>
      ) : null}

      <div className="btn-row" style={{ marginTop: "14px" }}>
        <button className="btn btn-grow" type="button" onClick={savePlan} disabled={savingPlan}>
          {savingPlan ? "جارٍ الحفظ..." : "حفظ خطة المعالجة"}
        </button>

        <button
          className="btn btn-secondary"
          type="button"
          onClick={closeFinding}
          disabled={closing || isClosed}
        >
          {isClosed ? "المخالفة مغلقة" : closing ? "جارٍ الإغلاق..." : "إغلاق المخالفة"}
        </button>
      </div>
    </div>
  );
        }
