"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChecklistItemEvidence from "@/components/checklist-item-evidence";
import { evaluateSmartChecklist } from "@/lib/smart-evaluation";
import { safeText, toSystemLabel } from "@/lib/display";
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
  response_type_v2?: string;
  numeric_unit?: string;
  target_min?: string;
  target_max?: string;
  calc_rule?: string;
  ui_hint_ar?: string;
  severity_default?: string;
  evidence_required?: boolean;
  photo_required?: boolean;
};

type ExistingResponse = {
  visit_system_id: string;
  checklist_item_id: string;
  response_value: string;
  finding_severity: string;
  comments: string;
  numeric_value?: string;
  numeric_value_2?: string;
  numeric_value_3?: string;
  numeric_unit?: string;
  calc_rule?: string;
  calc_result_text?: string;
  auto_judgement?: string;
};

type EvidenceRow = {
  evidence_id: string;
  visit_id: string;
  visit_system_id: string;
  checklist_item_id: string;
  asset_id?: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  caption: string;
  taken_by: string;
  taken_at: string;
};

type ActiveAsset = {
  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_name_ar: string;
  system_code: string;
  location_note: string;
  visit_system_id: string;
};

type Props = {
  visitId: string;
  visitSystems: VisitSystem[];
  checklistItems: ChecklistItem[];
  existingResponses: ExistingResponse[];
  existingEvidence: EvidenceRow[];
  activeAsset?: ActiveAsset | null;
};

type ItemState = {
  response_value: string;
  finding_severity: string;
  comments: string;
  corrective_action: string;
  numeric_value: string;
  numeric_value_2: string;
  numeric_value_3: string;
  numeric_unit: string;
  calc_rule: string;
  calc_result_text: string;
  auto_judgement: string;
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
    numeric_value: "",
    numeric_value_2: "",
    numeric_value_3: "",
    numeric_unit: "",
    calc_rule: "",
    calc_result_text: "",
    auto_judgement: "",
  };
}

function responseButtonClass(active: boolean, tone: "green" | "red" | "slate") {
  const base =
    "inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-sm font-bold transition min-w-[88px]";
  if (!active) {
    return `${base} border-slate-200 bg-white text-slate-700`;
  }

  if (tone === "green") {
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  }

  if (tone === "red") {
    return `${base} border-rose-200 bg-rose-50 text-rose-700`;
  }

  return `${base} border-slate-300 bg-slate-100 text-slate-800`;
}

function systemButtonClass(active: boolean) {
  return active
    ? "rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700"
    : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600";
}

function getSmartInputCount(item: ChecklistItem) {
  const rule = String(item.calc_rule || "").toUpperCase();
  if (rule === "PRESSURE_SETPOINTS") return 2;
  if (rule === "PRESSURE_STABILITY") return 3;
  if (String(item.response_type_v2 || "").toLowerCase() === "numeric_range") return 1;
  if (rule === "EMERGENCY_LIGHT_DURATION") return 1;
  return 0;
}

function smartInputLabel(item: ChecklistItem, index: number) {
  const rule = String(item.calc_rule || "").toUpperCase();
  const unit = String(item.numeric_unit || "").trim();

  if (rule === "PRESSURE_SETPOINTS") {
    if (index === 1) return `ضغط تشغيل الجوكي${unit ? ` (${unit})` : ""}`;
    if (index === 2) return `ضغط تشغيل المضخة الرئيسية${unit ? ` (${unit})` : ""}`;
  }

  if (rule === "PRESSURE_STABILITY") {
    if (index === 1) return `ضغط البدء${unit ? ` (${unit})` : ""}`;
    if (index === 2) return `ضغط الإيقاف${unit ? ` (${unit})` : ""}`;
    if (index === 3) return "عدد مرات إعادة التشغيل";
  }

  if (rule === "EMERGENCY_LIGHT_DURATION") {
    return `مدة التشغيل${unit ? ` (${unit})` : " (دقيقة)"}`;
  }

  if (String(item.response_type_v2 || "").toLowerCase() === "numeric_range") {
    return `القراءة${unit ? ` (${unit})` : ""}`;
  }

  return `قراءة ${index}`;
}

export default function VisitExecutionForm({
  visitId,
  visitSystems,
  checklistItems,
  existingResponses,
  existingEvidence,
  activeAsset,
}: Props) {
  const router = useRouter();

  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    activeAsset?.visit_system_id || visitSystems[0]?.visit_system_id || ""
  );

  const initialMap = useMemo(() => {
    const map: Record<string, ItemState> = {};

    for (const row of existingResponses) {
      map[itemKey(row.visit_system_id, row.checklist_item_id)] = {
        response_value: String(row.response_value || ""),
        finding_severity: String(row.finding_severity || ""),
        comments: String(row.comments || ""),
        corrective_action: "",
        numeric_value: String(row.numeric_value || ""),
        numeric_value_2: String(row.numeric_value_2 || ""),
        numeric_value_3: String(row.numeric_value_3 || ""),
        numeric_unit: String(row.numeric_unit || ""),
        calc_rule: String(row.calc_rule || ""),
        calc_result_text: String(row.calc_result_text || ""),
        auto_judgement: String(row.auto_judgement || ""),
      };
    }

    return map;
  }, [existingResponses]);

  const [formMap, setFormMap] = useState<Record<string, ItemState>>(initialMap);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openedEvidenceKey, setOpenedEvidenceKey] = useState<string | null>(null);

  const selectedSystem = visitSystems.find(
    (system) => String(system.visit_system_id) === String(selectedSystemId)
  );

  const selectedItems = checklistItems.filter(
    (item) => String(item.visit_system_id) === String(selectedSystemId)
  );

  const completedCount = selectedItems.filter((item) => {
    const state = formMap[itemKey(item.visit_system_id, item.checklist_item_id)];
    return Boolean(String(state?.response_value || "").trim());
  }).length;

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

  function applySmartEvaluation(
    item: ChecklistItem,
    nextState: Partial<ItemState>,
    currentState?: ItemState
  ) {
    const state = {
      ...(currentState || defaultItemState()),
      ...nextState,
    };

    const responseType = String(item.response_type_v2 || "pass_fail_na").toLowerCase();
    const calcRule = String(item.calc_rule || "");

    if (!calcRule && responseType === "pass_fail_na") {
      return;
    }

    const result = evaluateSmartChecklist({
      responseType,
      calcRule,
      numericUnit: state.numeric_unit || item.numeric_unit || "",
      targetMin: item.target_min ?? "",
      targetMax: item.target_max ?? "",
      numericValue: state.numeric_value,
      numericValue2: state.numeric_value_2,
      numericValue3: state.numeric_value_3,
    });

    updateItemState(item.visit_system_id, item.checklist_item_id, {
      ...state,
      response_value: result.responseValue || state.response_value,
      auto_judgement: result.autoJudgement || "",
      calc_result_text: result.resultTextAr || "",
      calc_rule: calcRule,
      numeric_unit: state.numeric_unit || item.numeric_unit || "",
      finding_severity:
        result.responseValue === "non_compliant"
          ? state.finding_severity || item.severity_default || "major"
          : "",
    });
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
          building_system_id: String(item.building_system_id || ""),
          checklist_item_id: String(item.checklist_item_id),
          item_code: String(item.item_code || ""),
          title: String(item.question_text || "Non-compliant item"),
          response_value: String(state.response_value || ""),
          finding_severity: String(
            state.finding_severity || item.severity_default || ""
          ),
          comments: String(state.comments || ""),
          corrective_action: String(state.corrective_action || ""),
          numeric_value: String(state.numeric_value || ""),
          numeric_value_2: String(state.numeric_value_2 || ""),
          numeric_value_3: String(state.numeric_value_3 || ""),
          numeric_unit: String(state.numeric_unit || item.numeric_unit || ""),
          calc_rule: String(state.calc_rule || item.calc_rule || ""),
          calc_result_text: String(state.calc_result_text || ""),
          auto_judgement: String(state.auto_judgement || ""),
          asset_id:
            activeAsset &&
            String(activeAsset.visit_system_id) === String(item.visit_system_id)
              ? String(activeAsset.asset_id)
              : "",
        };
      });

      const effectiveRows = rows.filter((row) =>
        String(row.response_value || "").trim()
      );

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
    <div>
      {activeAsset ? (
        <div
          className="card"
          style={{
            marginBottom: "12px",
            padding: "14px",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            فحص أصل محدد
          </div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "13px",
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            {safeText(activeAsset.asset_name_ar || activeAsset.asset_name, "أصل")}
            {activeAsset.asset_code ? ` · ${String(activeAsset.asset_code)}` : ""}
            {activeAsset.location_note ? ` · ${String(activeAsset.location_note)}` : ""}
          </div>
        </div>
      ) : null}

      {!activeAsset && visitSystems.length > 1 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          {visitSystems.map((system) => {
            const active =
              String(system.visit_system_id) === String(selectedSystemId);

            return (
              <button
                key={system.visit_system_id}
                type="button"
                onClick={() => setSelectedSystemId(String(system.visit_system_id))}
                className={systemButtonClass(active)}
              >
                {toSystemLabel(system.system_code)}
              </button>
            );
          })}
        </div>
      ) : null}

      {selectedSystem ? (
        <div
          className="card"
          style={{
            padding: "12px 14px",
            marginBottom: "12px",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#475569",
              fontWeight: 700,
            }}
          >
            النظام الحالي
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "16px",
              color: "#0f172a",
              fontWeight: 900,
              lineHeight: 1.6,
            }}
          >
            {toSystemLabel(selectedSystem.system_code)}
          </div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            تم إنجاز {completedCount} من {selectedItems.length} بند
          </div>
        </div>
      ) : null}

      {selectedItems.length === 0 ? (
        <EmptyPanel
          title="لا توجد بنود فحص"
          description="لم يتم العثور على بنود لهذا النظام داخل الزيارة."
        />
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {selectedItems.map((item, index) => {
            const state = getItemState(item.visit_system_id, item.checklist_item_id);
            const currentKey = itemKey(item.visit_system_id, item.checklist_item_id);

            const itemEvidence = existingEvidence.filter((row) => {
              const sameItem =
                String(row.visit_system_id) === String(item.visit_system_id) &&
                String(row.checklist_item_id) === String(item.checklist_item_id);

              if (!sameItem) return false;

              if (activeAsset?.asset_id) {
                return String(row.asset_id || "") === String(activeAsset.asset_id);
              }

              return true;
            });

            const isNonCompliant =
              String(state.response_value || "") === "non_compliant";

            const smartInputCount = getSmartInputCount(item);
            const showSmartArea = smartInputCount > 0;

            return (
              <div
                key={currentKey}
                className="card"
                style={{
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    lineHeight: 1.7,
                  }}
                >
                  بند {index + 1}
                  {item.section_name ? ` · ${String(item.section_name)}` : ""}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "16px",
                    lineHeight: 1.65,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {safeText(item.question_text, "-")}
                </div>

                {item.acceptance_criteria ? (
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      color: "#64748b",
                    }}
                  >
                    {String(item.acceptance_criteria)}
                  </div>
                ) : null}

                {item.ui_hint_ar ? (
                  <div style={{ marginTop: "8px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "7px 11px",
                        borderRadius: "999px",
                        background: "#f8fafc",
                        color: "#475569",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      {String(item.ui_hint_ar)}
                    </span>
                  </div>
                ) : null}

                {showSmartArea ? (
                  <div
                    className="card"
                    style={{
                      marginTop: "10px",
                      padding: "12px",
                      background: "#fcfcfd",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      القراءات
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                      {Array.from({ length: smartInputCount }).map((_, idx) => {
                        const inputIndex = idx + 1;
                        const fieldName =
                          inputIndex === 1
                            ? "numeric_value"
                            : inputIndex === 2
                            ? "numeric_value_2"
                            : "numeric_value_3";

                        const fieldValue =
                          inputIndex === 1
                            ? state.numeric_value
                            : inputIndex === 2
                            ? state.numeric_value_2
                            : state.numeric_value_3;

                        return (
                          <input
                            key={`${currentKey}-${fieldName}`}
                            className="field"
                            type="number"
                            step="any"
                            inputMode="decimal"
                            placeholder={smartInputLabel(item, inputIndex)}
                            value={fieldValue}
                            onChange={(e) =>
                              applySmartEvaluation(
                                item,
                                {
                                  [fieldName]: e.target.value,
                                } as Partial<ItemState>,
                                state
                              )
                            }
                          />
                        );
                      })}
                    </div>

                    {state.calc_result_text ? (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "10px 12px",
                          borderRadius: "14px",
                          background:
                            state.response_value === "non_compliant"
                              ? "#fef2f2"
                              : "#ecfdf5",
                          border:
                            state.response_value === "non_compliant"
                              ? "1px solid #fecaca"
                              : "1px solid #bbf7d0",
                          fontSize: "13px",
                          lineHeight: 1.8,
                          color:
                            state.response_value === "non_compliant"
                              ? "#991b1b"
                              : "#166534",
                        }}
                      >
                        {state.calc_result_text}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "10px",
                  }}
                >
                  <button
                    type="button"
                    className={responseButtonClass(
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
                    className={responseButtonClass(
                      state.response_value === "non_compliant",
                      "red"
                    )}
                    onClick={() =>
                      updateItemState(item.visit_system_id, item.checklist_item_id, {
                        response_value: "non_compliant",
                        finding_severity:
                          state.finding_severity ||
                          item.severity_default ||
                          "major",
                      })
                    }
                  >
                    غير مطابق
                  </button>

                  <button
                    type="button"
                    className={responseButtonClass(
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
                    className="card"
                    style={{
                      marginTop: "10px",
                      padding: "12px",
                      background: "#fcfcfd",
                    }}
                  >
                    <select
                      className="field"
                      value={state.finding_severity}
                      onChange={(e) =>
                        updateItemState(item.visit_system_id, item.checklist_item_id, {
                          finding_severity: e.target.value,
                        })
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
                        updateItemState(item.visit_system_id, item.checklist_item_id, {
                          comments: e.target.value,
                        })
                      }
                      style={{ marginTop: "8px" }}
                    />

                    <textarea
                      className="field"
                      placeholder="الإجراء التصحيحي المقترح"
                      value={state.corrective_action}
                      onChange={(e) =>
                        updateItemState(item.visit_system_id, item.checklist_item_id, {
                          corrective_action: e.target.value,
                        })
                      }
                      style={{ marginTop: "8px" }}
                    />
                  </div>
                ) : null}

                <div style={{ marginTop: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setOpenedEvidenceKey(
                        openedEvidenceKey === currentKey ? null : currentKey
                      )
                    }
                  >
                    {openedEvidenceKey === currentKey
                      ? "إخفاء الأدلة"
                      : `أدلة البند (${itemEvidence.length})`}
                  </button>
                </div>

                {openedEvidenceKey === currentKey ? (
                  <div style={{ marginTop: "10px" }}>
                    <ChecklistItemEvidence
                      visitId={visitId}
                      visitSystemId={String(item.visit_system_id)}
                      checklistItemId={String(item.checklist_item_id)}
                      assetId={activeAsset?.asset_id || ""}
                      rows={itemEvidence}
                    />
                  </div>
                ) : null}
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

      <div style={{ marginTop: "14px" }}>
        <button
          type="button"
          className="btn btn-grow"
          onClick={handleSaveAndClose}
          disabled={saving}
        >
          {saving ? "جارٍ الحفظ..." : "حفظ النتائج وإقفال الزيارة"}
        </button>
      </div>
    </div>
  );
}
