"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calcPumpPoint,
  resultLabelAr,
  PumpPointInput,
} from "@/lib/fire-pump-calcs";

type VisitSystem = {
  visit_system_id: string;
  building_system_id: string;
  system_code: string;
};

type Props = {
  visitId: string;
  visitSystem: VisitSystem;
};

type PointState = {
  point_type: string;
  label: string;
  target_flow_percent: string;
  target_flow_gpm: string;
  actual_flow_gpm: string;
  suction_pressure_psi: string;
  discharge_pressure_psi: string;
  rpm: string;
  notes: string;
};

const defaultPoints: PointState[] = [
  {
    point_type: "churn",
    label: "Churn / No Flow",
    target_flow_percent: "0",
    target_flow_gpm: "0",
    actual_flow_gpm: "0",
    suction_pressure_psi: "",
    discharge_pressure_psi: "",
    rpm: "",
    notes: "",
  },
  {
    point_type: "rated_100",
    label: "100% Rated Flow",
    target_flow_percent: "100",
    target_flow_gpm: "",
    actual_flow_gpm: "",
    suction_pressure_psi: "",
    discharge_pressure_psi: "",
    rpm: "",
    notes: "",
  },
  {
    point_type: "rated_150",
    label: "150% Rated Flow",
    target_flow_percent: "150",
    target_flow_gpm: "",
    actual_flow_gpm: "",
    suction_pressure_psi: "",
    discharge_pressure_psi: "",
    rpm: "",
    notes: "",
  },
];

function inputClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-50";
}

function labelClass() {
  return "mb-1 block text-xs font-black text-slate-600";
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function PumpCurveChart({
  points,
  ratedFlow,
  ratedPressure,
}: {
  points: Array<{
    label: string;
    flow: number;
    pressure: number;
    result: string;
  }>;
  ratedFlow: number;
  ratedPressure: number;
}) {
  const width = 340;
  const height = 220;
  const pad = 34;

  const maxFlow = Math.max(ratedFlow * 1.6, ...points.map((p) => p.flow), 1);
  const maxPressure = Math.max(
    ratedPressure * 1.5,
    ...points.map((p) => p.pressure),
    1
  );

  function x(flow: number) {
    return pad + (flow / maxFlow) * (width - pad * 2);
  }

  function y(pressure: number) {
    return height - pad - (pressure / maxPressure) * (height - pad * 2);
  }

  const sortedPoints = [...points].sort((a, b) => a.flow - b.flow);

  const line = sortedPoints
    .filter((p) => p.flow >= 0 && p.pressure > 0)
    .map((p) => `${x(p.flow)},${y(p.pressure)}`)
    .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-right text-sm font-black text-slate-800">
        منحنى أداء المضخة الحالي
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full rounded-2xl bg-white"
      >
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="#cbd5e1"
          strokeWidth="2"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={height - pad}
          stroke="#cbd5e1"
          strokeWidth="2"
        />

        <text x={width / 2} y={height - 6} textAnchor="middle" fontSize="10">
          Flow GPM
        </text>

        <text
          x="12"
          y={height / 2}
          textAnchor="middle"
          fontSize="10"
          transform={`rotate(-90 12 ${height / 2})`}
        >
          Net PSI
        </text>

        {line ? (
          <polyline
            points={line}
            fill="none"
            stroke="#0f766e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {sortedPoints.map((p) => (
          <g key={p.label}>
            <circle
              cx={x(p.flow)}
              cy={y(p.pressure)}
              r="5"
              fill={
                p.result === "fail"
                  ? "#dc2626"
                  : p.result === "warning"
                  ? "#d97706"
                  : p.result === "incomplete"
                  ? "#64748b"
                  : "#0f766e"
              }
            />
            <text
              x={x(p.flow)}
              y={y(p.pressure) - 10}
              textAnchor="middle"
              fontSize="9"
              fill="#334155"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function FirePumpTestForm({ visitId, visitSystem }: Props) {
  const router = useRouter();

  const [pumpTag, setPumpTag] = useState("");
  const [driverType, setDriverType] = useState("electric");
  const [testMethod, setTestMethod] = useState("flowmeter");
  const [ratedFlow, setRatedFlow] = useState("");
  const [ratedPressure, setRatedPressure] = useState("");
  const [ratedRpm, setRatedRpm] = useState("");
  const [points, setPoints] = useState<PointState[]>(defaultPoints);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const calculated = useMemo(() => {
    return points.map((point) => {
      const targetPercent = toNumber(point.target_flow_percent);
      const targetFlow =
        point.target_flow_gpm ||
        (ratedFlow && targetPercent > 0
          ? String(Math.round((toNumber(ratedFlow) * targetPercent) / 100))
          : point.target_flow_gpm);

      const calc = calcPumpPoint({
        ...point,
        target_flow_gpm: targetFlow,
        rated_flow_gpm: ratedFlow,
        rated_pressure_psi: ratedPressure,
        rated_speed_rpm: ratedRpm,
      });

      return {
        point,
        targetFlow,
        calc,
      };
    });
  }, [points, ratedFlow, ratedPressure, ratedRpm]);

  function updatePoint(index: number, patch: Partial<PointState>) {
    setPoints((prev) =>
      prev.map((point, i) => (i === index ? { ...point, ...patch } : point))
    );
  }

  async function savePumpTest() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payloadPoints: PumpPointInput[] = calculated.map((row) => ({
        point_type: row.point.point_type,
        target_flow_percent: row.point.target_flow_percent,
        target_flow_gpm: row.targetFlow,
        actual_flow_gpm: row.point.actual_flow_gpm,
        suction_pressure_psi: row.point.suction_pressure_psi,
        discharge_pressure_psi: row.point.discharge_pressure_psi,
        rpm: row.point.rpm,
        notes: row.point.notes,
      }));

      const res = await fetch(`/api/visits/${visitId}/pump-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_system_id: visitSystem.visit_system_id,
          building_system_id: visitSystem.building_system_id,
          pump_tag: pumpTag,
          driver_type: driverType,
          test_method: testMethod,
          rated_flow_gpm: ratedFlow,
          rated_pressure_psi: ratedPressure,
          rated_speed_rpm: ratedRpm,
          points: payloadPoints,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ اختبار المضخة");
      }

      setMessage(data.technicalJudgment || "تم حفظ اختبار المضخة بنجاح.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ اختبار المضخة");
    } finally {
      setSaving(false);
    }
  }

  const chartPoints = calculated.map((row) => ({
    label:
      row.point.point_type === "churn"
        ? "Churn"
        : row.point.point_type === "rated_100"
        ? "100%"
        : "150%",
    flow: row.calc.actual_flow_gpm,
    pressure: row.calc.net_pressure_psi,
    result: row.calc.result,
  }));

  return (
    <div dir="rtl" className="space-y-4">
      <div className="rounded-3xl border border-teal-100 bg-teal-50 p-4">
        <div className="text-xs font-black text-teal-700">
          وحدة فحص خاصة
        </div>
        <h2 className="mt-1 text-xl font-black text-slate-950">
          اختبار أداء مضخة الحريق
        </h2>
        <p className="mt-1 text-sm leading-7 text-slate-600">
          أدخل قراءات Churn و 100% و 150%، وسيحسب النظام صافي الضغط والنسب
          ويرسم منحنى الأداء الحالي.
        </p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass()}>رقم / اسم المضخة</label>
            <input
              className={inputClass()}
              value={pumpTag}
              onChange={(e) => setPumpTag(e.target.value)}
              placeholder="مثال: Fire Pump-01"
            />
          </div>

          <div>
            <label className={labelClass()}>نوع المحرك</label>
            <select
              className={inputClass()}
              value={driverType}
              onChange={(e) => setDriverType(e.target.value)}
            >
              <option value="electric">Electric</option>
              <option value="diesel">Diesel</option>
            </select>
          </div>

          <div>
            <label className={labelClass()}>طريقة الاختبار</label>
            <select
              className={inputClass()}
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value)}
            >
              <option value="flowmeter">Flowmeter</option>
              <option value="hose_header">Hose Header / Pitot</option>
              <option value="closed_loop">Closed Loop</option>
            </select>
          </div>

          <div>
            <label className={labelClass()}>Rated Speed - RPM</label>
            <input
              className={inputClass()}
              value={ratedRpm}
              onChange={(e) => setRatedRpm(e.target.value)}
              inputMode="decimal"
              placeholder="مثال: 2950"
            />
          </div>

          <div>
            <label className={labelClass()}>Rated Flow - GPM</label>
            <input
              className={inputClass()}
              value={ratedFlow}
              onChange={(e) => setRatedFlow(e.target.value)}
              inputMode="decimal"
              placeholder="مثال: 750"
            />
          </div>

          <div>
            <label className={labelClass()}>Rated Pressure - PSI</label>
            <input
              className={inputClass()}
              value={ratedPressure}
              onChange={(e) => setRatedPressure(e.target.value)}
              inputMode="decimal"
              placeholder="مثال: 120"
            />
          </div>
        </div>
      </div>

      <PumpCurveChart
        points={chartPoints}
        ratedFlow={toNumber(ratedFlow)}
        ratedPressure={toNumber(ratedPressure)}
      />

      <div className="space-y-3">
        {calculated.map((row, index) => {
          const point = row.point;
          const calc = row.calc;

          return (
            <div
              key={point.point_type}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black text-slate-500">
                    نقطة اختبار
                  </div>
                  <h3 className="text-lg font-black text-slate-950">
                    {point.label}
                  </h3>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
                  {resultLabelAr(calc.result)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className={labelClass()}>Target Flow %</label>
                  <input
                    className={inputClass()}
                    value={point.target_flow_percent}
                    onChange={(e) =>
                      updatePoint(index, {
                        target_flow_percent: e.target.value,
                      })
                    }
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClass()}>Target Flow GPM</label>
                  <input
                    className={inputClass()}
                    value={row.targetFlow}
                    onChange={(e) =>
                      updatePoint(index, {
                        target_flow_gpm: e.target.value,
                      })
                    }
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClass()}>Actual Flow GPM</label>
                  <input
                    className={inputClass()}
                    value={point.actual_flow_gpm}
                    onChange={(e) =>
                      updatePoint(index, {
                        actual_flow_gpm: e.target.value,
                      })
                    }
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClass()}>Suction Pressure PSI</label>
                  <input
                    className={inputClass()}
                    value={point.suction_pressure_psi}
                    onChange={(e) =>
                      updatePoint(index, {
                        suction_pressure_psi: e.target.value,
                      })
                    }
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClass()}>
                    Discharge Pressure PSI
                  </label>
                  <input
                    className={inputClass()}
                    value={point.discharge_pressure_psi}
                    onChange={(e) =>
                      updatePoint(index, {
                        discharge_pressure_psi: e.target.value,
                      })
                    }
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClass()}>Actual RPM</label>
                  <input
                    className={inputClass()}
                    value={point.rpm}
                    onChange={(e) =>
                      updatePoint(index, {
                        rpm: e.target.value,
                      })
                    }
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] font-bold text-slate-500">
                    Net PSI
                  </div>
                  <div className="text-lg font-black text-slate-950">
                    {calc.net_pressure_psi}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] font-bold text-slate-500">
                    % Rated Flow
                  </div>
                  <div className="text-lg font-black text-slate-950">
                    {calc.percent_rated_flow}%
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] font-bold text-slate-500">
                    % Rated Pressure
                  </div>
                  <div className="text-lg font-black text-slate-950">
                    {calc.percent_rated_pressure}%
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[11px] font-bold text-slate-500">
                    Corrected PSI
                  </div>
                  <div className="text-lg font-black text-slate-950">
                    {calc.corrected_pressure_psi}
                  </div>
                </div>
              </div>

              {calc.warnings.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-7 text-amber-800">
                  {calc.warnings.map((warning) => (
                    <div key={warning}>• {warning}</div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3">
                <label className={labelClass()}>ملاحظات المفتش</label>
                <textarea
                  className={inputClass()}
                  value={point.notes}
                  onChange={(e) =>
                    updatePoint(index, {
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          );
        })}
      </div>

      {message ? (
        <div className="rounded-3xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold leading-7 text-teal-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-800">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={savePumpTest}
        disabled={saving}
        className="w-full rounded-3xl bg-teal-700 px-4 py-4 text-base font-black text-white shadow-sm disabled:bg-slate-400"
      >
        {saving ? "جاري حفظ اختبار المضخة..." : "حفظ اختبار المضخة"}
      </button>
    </div>
  );
}
