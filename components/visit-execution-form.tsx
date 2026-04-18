"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChecklistItemEvidence from "@/components/checklist-item-evidence";
import { evaluateSmartChecklist } from "@/lib/smart-checklist";

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
  response_type_v2: string;
  numeric_unit: string;
  target_min: string;
  target_max: string;
  calc_rule: string;
  ui_hint_ar: string;
  severity_default: string;
  evidence_required: boolean;
  photo_required: boolean;
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
  auto_judgement: string;
  calc_result_text: string;
};

function itemKey(visitSystemId: string, checklistItemId: string) {
  return `${visitSystemId}__${checklistItemId}`;
}

function defaultItemState(item?: ChecklistItem): ItemState {
  return {
    response_value: "",
    finding_severity: "",
    comments: "",
    corrective_action: "",
    numeric_value: "",
    numeric_value_2: "",
    numeric_value_3: "",
    numeric_unit: String(item?.numeric_unit || ""),
    auto_judgement: "",
    calc_result_text: "",
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

function isSmartItem(item: ChecklistItem) {
  return Boolean(String(item.calc_rule || "").trim()) ||
    String(item.response_type_v2 || "").toLowerCase() === "numeric_range";
}

function smartBadgeText(item: ChecklistItem) {
  if (String(item.calc_rule || "").trim()) {
    return `قاعدة ذكية: ${String(item.calc_rule)}`;
  }

  if (String(item.response_type_v2 || "").toLowerCase() === "numeric_range") {
    return "إدخال رقمي";
  }

  return "";
}

function targetText(item: ChecklistItem) {
  const hasMin = String(item.target_min || "").trim() !== "";
  const hasMax = String(item.target_max || "").trim() !== "";
  const unit = String(item.numeric_unit || "");

  if (hasMin && hasMax) {
    return `المجال: ${item.target_min} - ${item.target_max}${unit ? ` ${unit}` : ""}`;
  }

  if (hasMin) {
    return `الحد الأدنى: ${item.target_min}${unit ? ` ${unit}` : ""}`;
  }

  if (hasMax) {
    return `الحد الأعلى: ${item.target_max}${unit ? ` ${unit}` : ""}`;
  }

  return "";
}

function primaryLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "EMERGENCY_LIGHT_DURATION") return "المدة الفعلية";
  if (String(item.calc_rule) === "PRESSURE_SETPOINTS") return "ضغط تشغيل الجوكي";
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "ضغط البدء";
  return "القراءة الفعلية";
}

function secondaryLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "PRESSURE_SETPOINTS") return "ضغط تشغيل المضخة الرئيسية";
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "ضغط الإيقاف";
  return "";
}

function thirdLabel(item: ChecklistItem) {
  if (String(item.calc_rule) === "PRESSURE_STABILITY") return "عدد مرات إعادة التشغيل";
  return "";
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
        auto_judgement: String(row.auto_judgement || ""),
        calc_result_text: String(row.calc_result_text || ""),
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

  function getItemState(item: ChecklistItem): ItemState {
    return formMap[itemKey(item.visit_system_id, item.checklist_item_id)] || defaultItemState(item);
  }

  function setItemState(item: ChecklistItem, nextState: ItemState) {
    const key = itemKey(item.visit_system_id, item.checklist_item_id);

    setFormMap((prev) => ({
      ...prev,
      [key]: nextState,
    }));
  }

  function updateStandardItemState(
    item: ChecklistItem,
    patch: Partial<ItemState>
  ) {
    const current = getItemState(item);

    const nextState: ItemState = {
      ...current,
      ...patch,
    };

    if (String(nextState.response_value || "") !== "non_compliant") {
      nextState.finding_severity = "";
    }

    setItemState(item, nextState);
  }

  function updateSmartItemState(
    item: ChecklistItem,
    patch: Partial<ItemState>
  ) {
    const current = getItemState(item);

    const nextState: ItemState = {
      ...current,
      ...patch,
      numeric_unit: String(item.numeric_unit || current.numeric_unit || ""),
    };

    if (String(nextState.response_value || "") === "not_applicable") {
      nextState.auto_judgement = "";
      nextState.calc_result_text = "تم تحديد البند كغير منطبق.";
      nextState.finding_severity = "";
      setItemState(item, nextState);
      return;
    }

    const evaluation = evaluateSmartChecklist({
      responseType: item.response_type_v2,
      calcRule: item.calc_rule,
      numericUnit: item.numeric_unit,
      targetMin: item.target_min,
      targetMax: item.target_max,
      numericValue: nextState.numeric_value,
      numericValue2: nextState.numeric_value_2,
      numericValue3: nextState.numeric_value_3,
    });

    nextState.response_value = String(evaluation.responseValue || "");
    nextState.auto_judgement = String(evaluation.autoJudgement || "");
    nextState.calc_result_text = String(evaluation.resultTextAr || "");

    if (String(nextState.response_value) === "non_compliant") {
      nextState.finding_severity =
        nextState.finding_severity || item.severity_default || "major";
    } else {
      nextState.finding_severity = "";
    }

    setItemState(item, nextState);
  }

  async function handleSaveAndClose() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const rows = checklistItems.map((item) => {
        const state = getItemState(item);

        return {
          visit_system_id: String(item.visit_system_id),
          building_system_id: String(item.building_system_id || ""),
          checklist_item_id: String(item.checklist_item_id),
          item_code: String(item.item_code || ""),
          title: String(item.question_text || "Non-compliant item"),
          response_value: String(state.response_value || ""),
          finding_severity:
            String(state.finding_severity || "") ||
            (String(state.response_value) === "non_compliant"
              ? String(item.severity_default || "major")
              : ""),
          comments: String(state.comments || ""),
          corrective_action: String(state.corrective_action || ""),
          numeric_value: String(state.numeric_value || ""),
          numeric_value_2: String(state.numeric_value_2 || ""),
          numeric_value_3: String(state.numeric_value_3 || ""),
          numeric_unit: String(item.numeric_unit || state.numeric_unit || ""),
          calc_rule: String(item.calc_rule || ""),
          calc_result_text: String(state.calc_result_text || ""),
          auto_judgement: String(state.auto_judgement || ""),
          severity_default: String(item.severity_default || "major"),
          calc_payload_json: {
            numeric_value: String(state.numeric_value || ""),
            numeric_value_2: String(state.numeric_value_2 || ""),
            numeric_value_3: String(state.numeric_value_3 || ""),
            numeric_unit: String(item.numeric_unit || state.numeric_unit || ""),
            calc_rule: String(item.calc_rule || ""),
            auto_judgement: String(state.auto_judgement || ""),
            calc_result_text: String(state.calc_result_text || ""),
          },
          asset_id:
            activeAsset &&
            String(activeAsset.visit_system_id) === String(item.visit_system_id)
              ? String(activeAsset.asset_id)
              : "",
        };
      });

      const effectiveRows = rows.filter(
        (row) => String(row.response_value || "").trim() !== ""
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
    <section className="card">
      <div className="section-title">تنفيذ الزيارة</div>
      <div className="section-subtitle">
        سجل نتائج الفحص لكل بند، وأضف الدليل مباشرة تحت البند نفسه.
      </div>

      {activeAsset ? (
        <div
          style={{
            marginTop: "14px",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "14px",
            background: "#f8fafc",
          }}
        >
          <div className="section-title" style={{ fontSize: "15px" }}>
            فحص أصل محدد
          </div>
          <div className="section-subtitle" style={{ marginTop: "6px" }}>
            {String(activeAsset.asset_name_ar || activeAsset.asset_name || "أصل")}
            {activeAsset.asset_code ? ` · ${String(activeAsset.asset_code)}` : ""}
            {activeAsset.location_note ? ` · ${String(activeAsset.location_note)}` : ""}
          </div>
        </div>
      ) : null}

      {!activeAsset && visitSystems.length > 1 ? (
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
            const state = getItemState(item);

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

            const smart = isSmartItem(item);
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

                  <div className="badge-wrap" style={{ marginTop: "10px" }}>
                    {smartBadgeText(item) ? (
                      <span className="badge">{smartBadgeText(item)}</span>
                    ) : null}

                    {item.numeric_unit ? (
                      <span className="badge">الوحدة: {item.numeric_unit}</span>
                    ) : null}

                    {targetText(item) ? (
                      <span className="badge">{targetText(item)}</span>
                    ) : null}
                  </div>

                  {item.ui_hint_ar ? (
                    <div
                      style={{
                        marginTop: "12px",
                        border: "1px solid #dbeafe",
                        background: "#eff6ff",
                        color: "#1e3a8a",
                        borderRadius: "16px",
                        padding: "12px",
                        fontSize: "14px",
                        lineHeight: 1.8,
                      }}
                    >
                      {item.ui_hint_ar}
                    </div>
                  ) : null}
                </div>

                <div style={{ padding: "0 16px 18px" }}>
                  {!smart ? (
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
                          updateStandardItemState(item, {
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
                          updateStandardItemState(item, {
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
                        className={buttonClass(
                          state.response_value === "not_applicable",
                          "slate"
                        )}
                        onClick={() =>
                          updateStandardItemState(item, {
                            response_value: "not_applicable",
                            finding_severity: "",
                          })
                        }
                      >
                        غير منطبق
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: "12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "20px",
                        padding: "14px",
                        background: "#fcfcfd",
                      }}
                    >
                      <input
                        className="field"
                        type="number"
                        inputMode="decimal"
                        placeholder={primaryLabel(item)}
                        value={state.numeric_value}
                        onChange={(e) =>
                          updateSmartItemState(item, {
                            numeric_value: e.target.value,
                          })
                        }
                      />

                      {secondaryLabel(item) ? (
                        <input
                          className="field"
                          type="number"
                          inputMode="decimal"
                          placeholder={secondaryLabel(item)}
                          value={state.numeric_value_2}
                          onChange={(e) =>
                            updateSmartItemState(item, {
                              numeric_value_2: e.target.value,
                            })
                          }
                          style={{ marginTop: "12px" }}
                        />
                      ) : null}

                      {thirdLabel(item) ? (
                        <input
                          className="field"
                          type="number"
                          inputMode="decimal"
                          placeholder={thirdLabel(item)}
                          value={state.numeric_value_3}
                          onChange={(e) =>
                            updateSmartItemState(item, {
                              numeric_value_3: e.target.value,
                            })
                          }
                          style={{ marginTop: "12px" }}
                        />
                      ) : null}

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginTop: "12px",
                        }}
                      >
                        <button
                          type="button"
                          className={buttonClass(
                            state.response_value === "not_applicable",
                            "slate"
                          )}
                          onClick={() =>
                            updateSmartItemState(item, {
                              response_value: "not_applicable",
                            })
                          }
                        >
                          غير منطبق
                        </button>

                        <button
                          type="button"
                          className={buttonClass(false, "slate")}
                          onClick={() =>
                            setItemState(item, defaultItemState(item))
                          }
                        >
                          مسح القراءة
                        </button>
                      </div>

                      {state.calc_result_text ? (
                        <div
                          style={{
                            marginTop: "12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "16px",
                            padding: "12px",
                            background:
                              state.auto_judgement === "fail"
                                ? "#fef2f2"
                                : state.auto_judgement === "pass"
                                ? "#ecfdf5"
                                : "#f8fafc",
                            color:
                              state.auto_judgement === "fail"
                                ? "#b91c1c"
                                : state.auto_judgement === "pass"
                                ? "#047857"
                                : "#334155",
                            fontSize: "14px",
                            lineHeight: 1.8,
                          }}
                        >
                          {state.calc_result_text}
                        </div>
                      ) : null}
                    </div>
                  )}

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
                          updateStandardItemState(item, {
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
                          updateStandardItemState(item, {
                            comments: e.target.value,
                          })
                        }
                        style={{ marginTop: "12px" }}
                      />

                      <textarea
                        className="field"
                        placeholder="الإجراء التصحيحي المقترح"
                        value={state.corrective_action}
                        onChange={(e) =>
                          updateStandardItemState(item, {
                            corrective_action: e.target.value,
                          })
                        }
                        style={{ marginTop: "12px" }}
                      />
                    </div>
                  ) : null}

                  <ChecklistItemEvidence
                    visitId={visitId}
                    visitSystemId={String(item.visit_system_id)}
                    checklistItemId={String(item.checklist_item_id)}
                    assetId={activeAsset?.asset_id || ""}
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
