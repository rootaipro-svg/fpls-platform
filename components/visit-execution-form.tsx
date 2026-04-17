"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChecklistItemEvidence from "@/components/checklist-item-evidence";

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

type EvidenceRow = {
  evidence_id: string;
  visit_id: string;
  visit_system_id: string;
  checklist_item_id: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  caption: string;
  taken_by: string;
  taken_at: string;
};

type Props = {
  visitId: string;
  visitSystems: VisitSystem[];
  checklistItems: ChecklistItem[];
  existingResponses: ExistingResponse[];
  existingEvidence: EvidenceRow[];
};

type ItemState = {
  response_value: string;
  finding_severity: string;
  comments: string;
  corrective_action: string;
};

function itemKey(visitSystemId: string, checklistItemId: string) {
  return `${visitSystemId}__${checklistItemId}`;
}

function defaultItemState(): ItemState {
  return {
    response_value: "",
    finding_severity: "",
    comments: "",
    corrective_action: "",
  };
}

function buttonClass(active: boolean, tone: "green" | "red" | "slate") {
  const base =
    "inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-base font-semibold transition min-w-[108px]";
  if (!active) {
    return `${base} border-slate-200 bg-white text-slate-800`;
  }

  if (tone === "green") {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  if (tone === "red") {
    return `${base} border-rose-200 bg-rose-50 text-rose-700`;
  }

  return `${base} border-slate-300 bg-slate-100 text-slate-800`;
}

export default function VisitExecutionForm({
  visitId,
  visitSystems,
  checklistItems,
  existingResponses,
  existingEvidence,
}: Props) {
  const router = useRouter();

  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    visitSystems[0]?.visit_system_id || ""
  );

  const initialMap = useMemo(() => {
    const map: Record<string, ItemState> = {};

    for (const row of existingResponses) {
      map[itemKey(row.visit_system_id, row.checklist_item_id)] = {
        response_value: String(row.response_value || ""),
        finding_severity: String(row.finding_severity || ""),
        comments: String(row.comments || ""),
        corrective_action: "",
      };
    }

    return map;
  }, [existingResponses]);

  const [formMap, setFormMap] = useState<Record<string, ItemState>>(initialMap);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSystem = visitSystems.find(
    (system) => String(system.visit_system_id) === String(selectedSystemId)
  );

  const selectedItems = checklistItems.filter(
    (item) => String(item.visit_system_id) === String(selectedSystemId)
  );

  function getItemState(visitSystemId: string, checklistItemId: string): ItemState {
    return formMap[itemKey(visitSystemId, checklistItemId)] || defaultItemState();
  }

  function updateItemState(
    visitSystemId: string,
    checklistItemId: string,
    patch: Partial<ItemState>
  ) {
    const key = itemKey(visitSystemId, checklistItemId);

    setFormMap((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || defaultItemState()),
        ...patch,
      },
    }));
  }

  async function handleSaveAndClose() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const rows = checklistItems.map((item) => {
        const state = getItemState(item.visit_system_id, item.checklist_item_id);

        return {
          visit_system_id: String(item.visit_system_id),
          checklist_item_id: String(item.checklist_item_id),
          response_value: String(state.response_value || ""),
          finding_severity: String(state.finding_severity || ""),
          comments: String(state.comments || ""),
          corrective_action: String(state.corrective_action || ""),
        };
      });

      const effectiveRows = rows.filter((row) => String(row.response_value || "").trim());

      if (effectiveRows.length === 0) {
        throw new Error("سجل نتيجة بند واحد على الأقل قبل الحفظ");
      }

      const res = await fetch(`/api/visits/${visitId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_id: visitId,
          responses: effectiveRows,
          close_visit: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ نتائج الزيارة");
      }

      setMessage("تم حفظ النتائج وإقفال الزيارة بنجاح");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ نتائج الزيارة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <div className="section-title">تنفيذ الزيارة</div>
      <div className="section-subtitle">
        سجل نتائج الفحص لكل بند، وأضف الدليل مباشرة تحت البند نفسه.
      </div>

      {visitSystems.length > 1 ? (
        <div className="badge-wrap" style={{ marginTop: "14px" }}>
          {visitSystems.map((system) => {
            const active =
              String(system.visit_system_id) === String(selectedSystemId);

            return (
              <button
                key={system.visit_system_id}
                type="button"
                onClick={() => setSelectedSystemId(String(system.visit_system_id))}
                className={active ? "badge badge-active" : "badge"}
                style={{
                  border: active ? "1px solid #0f766e" : "1px solid #e2e8f0",
                  background: active ? "#0f766e" : "#ffffff",
                  color: active ? "#ffffff" : "#0f172a",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  fontWeight: 700,
                }}
              >
                {system.system_code}
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedSystem ? (
        <div className="section-subtitle" style={{ marginTop: "12px" }}>
          النظام الحالي: {selectedSystem.system_code}
        </div>
      ) : null}

      {selectedItems.length === 0 ? (
        <div style={{ marginTop: "16px" }} className="muted-note">
          لا توجد بنود فحص لهذا النظام داخل هذه الزيارة.
        </div>
      ) : (
        <div className="stack-3" style={{ marginTop: "16px" }}>
          {selectedItems.map((item, index) => {
            const state = getItemState(item.visit_system_id, item.checklist_item_id);

            const itemEvidence = existingEvidence.filter(
              (row) =>
                String(row.visit_system_id) === String(item.visit_system_id) &&
                String(row.checklist_item_id) === String(item.checklist_item_id)
            );

            const isNonCompliant =
              String(state.response_value) === "non_compliant";

            return (
              <div
                key={`${item.visit_system_id}-${item.checklist_item_id}`}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "24px",
                  background: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "18px 16px 8px" }}>
                  <div className="checklist-item-section">
                    {item.section_name || "Section"} · بند {index + 1}
                  </div>

                  <div
                    className="checklist-item-title"
                    style={{ marginTop: "10px" }}
                  >
                    {item.question_text}
                  </div>

                  {item.acceptance_criteria ? (
                    <div
                      className="checklist-item-criteria"
                      style={{ marginTop: "10px" }}
                    >
                      {item.acceptance_criteria}
                    </div>
                  ) : null}
                </div>

                <div style={{ padding: "0 16px 18px" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginTop: "10px",
                    }}
                  >
                    <button
                      type="button"
                      className={buttonClass(
                        state.response_value === "compliant",
                        "green"
                      )}
                      onClick={() =>
                        updateItemState(item.visit_system_id, item.checklist_item_id, {
                          response_value: "compliant",
                          finding_severity: "",
                        })
                      }
                    >
                      مطابق
                    </button>

                    <button
                      type="button"
                      className={buttonClass(
                        state.response_value === "non_compliant",
                        "red"
                      )}
                      onClick={() =>
                        updateItemState(item.visit_system_id, item.checklist_item_id, {
                          response_value: "non_compliant",
                        })
                      }
                    >
                      غير مطابق
                    </button>

                    <button
                      type="button"
                      className={buttonClass(
                        state.response_value === "not_applicable",
                        "slate"
                      )}
                      onClick={() =>
                        updateItemState(item.visit_system_id, item.checklist_item_id, {
                          response_value: "not_applicable",
                          finding_severity: "",
                        })
                      }
                    >
                      غير منطبق
                    </button>
                  </div>

                  {isNonCompliant ? (
                    <div
                      style={{
                        marginTop: "14px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "20px",
                        padding: "14px",
                        background: "#fcfcfd",
                      }}
                    >
                      <select
                        className="field"
                        value={state.finding_severity}
                        onChange={(e) =>
                          updateItemState(
                            item.visit_system_id,
                            item.checklist_item_id,
                            {
                              finding_severity: e.target.value,
                            }
                          )
                        }
                      >
                        <option value="">اختر الشدة</option>
                        <option value="critical">حرج</option>
                        <option value="major">مرتفع</option>
                        <option value="minor">منخفض</option>
                      </select>

                      <textarea
                        className="field"
                        placeholder="ملاحظات المفتش"
                        value={state.comments}
                        onChange={(e) =>
                          updateItemState(
                            item.visit_system_id,
                            item.checklist_item_id,
                            {
                              comments: e.target.value,
                            }
                          )
                        }
                        style={{ marginTop: "12px" }}
                      />

                      <textarea
                        className="field"
                        placeholder="الإجراء التصحيحي المقترح"
                        value={state.corrective_action}
                        onChange={(e) =>
                          updateItemState(
                            item.visit_system_id,
                            item.checklist_item_id,
                            {
                              corrective_action: e.target.value,
                            }
                          )
                        }
                        style={{ marginTop: "12px" }}
                      />
                    </div>
                  ) : null}

                  <ChecklistItemEvidence
                    visitId={visitId}
                    visitSystemId={String(item.visit_system_id)}
                    checklistItemId={String(item.checklist_item_id)}
                    rows={itemEvidence}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message ? (
        <div className="alert-success" style={{ marginTop: "16px" }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="alert-error" style={{ marginTop: "16px" }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: "16px" }}>
        <button
          type="button"
          className="btn btn-grow"
          onClick={handleSaveAndClose}
          disabled={saving}
        >
          {saving ? "جارٍ الحفظ..." : "حفظ النتائج وإقفال الزيارة"}
        </button>
      </div>
    </section>
  );
}
