"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ShieldAlert } from "lucide-react";

type VisitSystem = {
  visit_system_id: string;
  building_system_id: string;
  system_code: string;
};

type ChecklistItem = {
  visit_system_id: string;
  building_system_id: string;
  system_code: string;
  checklist_item_id: string;
  item_code: string;
  section_name: string;
  question_text: string;
  acceptance_criteria: string;
};

type ExistingResponse = {
  visit_system_id: string;
  checklist_item_id: string;
  response_value: string;
  finding_severity: string;
  comments: string;
};

type Props = {
  visitId: string;
  visitSystems: VisitSystem[];
  checklistItems: ChecklistItem[];
  existingResponses: ExistingResponse[];
};

type ResponseState = {
  response_value: string;
  finding_severity: string;
  comments: string;
  corrective_action: string;
};

function makeKey(visitSystemId: string, checklistItemId: string) {
  return `${visitSystemId}__${checklistItemId}`;
}

export default function VisitExecutionForm({
  visitId,
  visitSystems,
  checklistItems,
  existingResponses,
}: Props) {
  const router = useRouter();

  const initialResponses = useMemo(() => {
    const map: Record<string, ResponseState> = {};
    for (const row of existingResponses) {
      map[makeKey(String(row.visit_system_id), String(row.checklist_item_id))] = {
        response_value: String(row.response_value || ""),
        finding_severity: String(row.finding_severity || "major"),
        comments: String(row.comments || ""),
        corrective_action: "",
      };
    }
    return map;
  }, [existingResponses]);

  const [responses, setResponses] = useState<Record<string, ResponseState>>(initialResponses);
  const [activeSystemId, setActiveSystemId] = useState<string>(
    String(visitSystems[0]?.visit_system_id || "")
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeSystem = visitSystems.find(
    (s) => String(s.visit_system_id) === String(activeSystemId)
  );

  const activeItems = checklistItems.filter(
    (item) => String(item.visit_system_id) === String(activeSystemId)
  );

  const totals = useMemo(() => {
    let pass = 0;
    let fail = 0;
    let na = 0;

    for (const item of checklistItems) {
      const key = makeKey(item.visit_system_id, item.checklist_item_id);
      const value = responses[key]?.response_value || "";

      if (value === "compliant") pass += 1;
      if (value === "non_compliant") fail += 1;
      if (value === "not_applicable") na += 1;
    }

    return { pass, fail, na };
  }, [checklistItems, responses]);

  function updateResponse(
    visitSystemId: string,
    checklistItemId: string,
    patch: Partial<ResponseState>
  ) {
    const key = makeKey(visitSystemId, checklistItemId);
    setResponses((prev) => ({
      ...prev,
      [key]: {
        response_value: prev[key]?.response_value || "",
        finding_severity: prev[key]?.finding_severity || "major",
        comments: prev[key]?.comments || "",
        corrective_action: prev[key]?.corrective_action || "",
        ...patch,
      },
    }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payloadResponses = checklistItems
        .map((item) => {
          const key = makeKey(item.visit_system_id, item.checklist_item_id);
          const state = responses[key];

          if (!state?.response_value) return null;

          const findingFlag = state.response_value === "non_compliant";

          return {
            visit_system_id: item.visit_system_id,
            building_system_id: item.building_system_id,
            checklist_item_id: item.checklist_item_id,
            system_component_id: "",
            response_value: state.response_value,
            score_value: "",
            finding_flag: findingFlag,
            finding_severity: findingFlag ? state.finding_severity || "major" : "",
            comments: state.comments || "",
            corrective_action: findingFlag ? state.corrective_action || "" : "",
            item_code: item.item_code || item.checklist_item_id,
            title: item.question_text || "Checklist item",
            evidence_count: 0,
          };
        })
        .filter(Boolean);

      if (payloadResponses.length === 0) {
        throw new Error("قم بتسجيل إجابة واحدة على الأقل قبل الحفظ.");
      }

      const failCount = payloadResponses.filter(
        (r: any) => r.response_value === "non_compliant"
      ).length;

      const summaryResult =
        failCount === 0 ? "compliant" : failCount > 0 ? "pass_with_remarks" : "pending";

      const res = await fetch(`/api/visits/${visitId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_date: new Date().toISOString().slice(0, 10),
          summary_result: summaryResult,
          responses: payloadResponses,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ نتائج الزيارة");
      }

      setMessage("تم حفظ نتائج الزيارة وإقفالها بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ نتائج الزيارة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-title">تنفيذ الزيارة</div>
      <div className="section-subtitle">
        سجل نتائج الفحص لكل بند، وسيتم إنشاء المخالفات تلقائيًا عند عدم المطابقة
      </div>

      <div className="execution-summary" style={{ marginTop: "14px" }}>
        <div className="execution-summary-card">
          <div className="execution-summary-value">{totals.pass}</div>
          <div className="execution-summary-label">مطابق</div>
        </div>
        <div className="execution-summary-card">
          <div className="execution-summary-value">{totals.fail}</div>
          <div className="execution-summary-label">غير مطابق</div>
        </div>
        <div className="execution-summary-card">
          <div className="execution-summary-value">{totals.na}</div>
          <div className="execution-summary-label">غير منطبق</div>
        </div>
      </div>

      <div className="execution-system-tabs" style={{ marginTop: "16px" }}>
        {visitSystems.map((system) => (
          <button
            key={system.visit_system_id}
            type="button"
            className={`execution-system-tab ${
              String(activeSystemId) === String(system.visit_system_id) ? "active" : ""
            }`}
            onClick={() => setActiveSystemId(String(system.visit_system_id))}
          >
            {system.system_code}
          </button>
        ))}
      </div>

      {activeItems.length === 0 ? (
        <div style={{ marginTop: "16px" }} className="empty-state">
          <div className="empty-state-icon">
            <ClipboardCheck size={24} />
          </div>
          <div className="empty-state-title">لا توجد بنود فحص لهذا النظام</div>
          <div className="empty-state-text">
            لم يتم تحميل checklist لهذا النظام داخل الزيارة الحالية.
          </div>
        </div>
      ) : (
        <div className="stack-3" style={{ marginTop: "16px" }}>
          {activeItems.map((item, index) => {
            const key = makeKey(item.visit_system_id, item.checklist_item_id);
            const state = responses[key] || {
              response_value: "",
              finding_severity: "major",
              comments: "",
              corrective_action: "",
            };

            return (
              <div key={key} className="checklist-item">
                <div className="checklist-item-section">
                  {item.section_name || "Section"} · بند {index + 1}
                </div>

                <div className="checklist-item-title">{item.question_text}</div>

                <div className="checklist-item-criteria">
                  {item.acceptance_criteria || ""}
                </div>

                <div className="answer-row">
                  <button
                    type="button"
                    className={`answer-btn ${
                      state.response_value === "compliant" ? "active-pass" : ""
                    }`}
                    onClick={() =>
                      updateResponse(item.visit_system_id, item.checklist_item_id, {
                        response_value: "compliant",
                        finding_severity: "",
                      })
                    }
                  >
                    مطابق
                  </button>

                  <button
                    type="button"
                    className={`answer-btn ${
                      state.response_value === "non_compliant" ? "active-fail" : ""
                    }`}
                    onClick={() =>
                      updateResponse(item.visit_system_id, item.checklist_item_id, {
                        response_value: "non_compliant",
                        finding_severity: state.finding_severity || "major",
                      })
                    }
                  >
                    غير مطابق
                  </button>

                  <button
                    type="button"
                    className={`answer-btn ${
                      state.response_value === "not_applicable" ? "active-na" : ""
                    }`}
                    onClick={() =>
                      updateResponse(item.visit_system_id, item.checklist_item_id, {
                        response_value: "not_applicable",
                        finding_severity: "",
                      })
                    }
                  >
                    غير منطبق
                  </button>
                </div>

                <div className="response-panel">
                  <div className="response-grid-2">
                    {state.response_value === "non_compliant" ? (
                      <select
                        className="field"
                        value={state.finding_severity || "major"}
                        onChange={(e) =>
                          updateResponse(item.visit_system_id, item.checklist_item_id, {
                            finding_severity: e.target.value,
                          })
                        }
                      >
                        <option value="critical">حرج</option>
                        <option value="major">مرتفع</option>
                        <option value="minor">منخفض</option>
                      </select>
                    ) : (
                      <div className="execution-note">
                        اختر “غير مطابق” لتحديد شدة المخالفة والإجراء التصحيحي.
                      </div>
                    )}

                    <input
                      className="field"
                      placeholder="ملاحظات المفتش"
                      value={state.comments}
                      onChange={(e) =>
                        updateResponse(item.visit_system_id, item.checklist_item_id, {
                          comments: e.target.value,
                        })
                      }
                    />
                  </div>

                  {state.response_value === "non_compliant" ? (
                    <textarea
                      className="field"
                      style={{ marginTop: "10px" }}
                      placeholder="الإجراء التصحيحي المقترح"
                      value={state.corrective_action}
                      onChange={(e) =>
                        updateResponse(item.visit_system_id, item.checklist_item_id, {
                          corrective_action: e.target.value,
                        })
                      }
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      <div className="execution-footer">
        <div className="btn-row" style={{ marginTop: "14px" }}>
          <button className="btn btn-grow" type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? "جارٍ حفظ النتائج..." : "حفظ النتائج وإقفال الزيارة"}
          </button>
        </div>
