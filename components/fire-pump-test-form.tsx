"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Gauge, LockKeyhole, Save } from "lucide-react";

type VisitSystem = {
  visit_system_id: string;
  building_system_id: string;
  system_code: string;
};

type PumpProfile = {
  pump_profile_id?: string;
  building_system_id?: string;
  system_code?: string;
  pump_tag?: string;
  pump_location?: string;
  driver_type?: string;
  manufacturer?: string;
  model?: string;
  serial_no?: string;
  rated_flow_gpm?: string;
  rated_pressure_psi?: string;
  rated_speed_rpm?: string;
  test_method_default?: string;
  flow_meter_available?: string;
  hose_header_available?: string;
  churn_run_minutes?: string;
  notes?: string;
};

type Props = {
  visitId: string;
  visitSystem: VisitSystem;
  visitType?: string;
};

type PointState = {
  point_type: "churn" | "rated_100" | "rated_150";
  label: string;
  target_flow_percent: string;
  target_flow_gpm: string;
  actual_flow_gpm: string;
  suction_pressure_psi: string;
  discharge_pressure_psi: string;
  rpm: string;
  run_minutes: string;
  notes: string;
};

function normalize(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isAnnualVisit(visitType: unknown) {
  const value = normalize(visitType);
  return ["annual", "annual_flow", "flow_test", "performance_test"].includes(
    value
  );
}

function isDieselSystem(systemCode: unknown) {
  return normalize(systemCode).includes("diesel");
}

function isElectricSystem(systemCode: unknown) {
  const code = normalize(systemCode);
  return code.includes("elec") || code.includes("electric");
}

function inferDriverType(systemCode: unknown) {
  if (isDieselSystem(systemCode)) return "diesel";
  if (isElectricSystem(systemCode)) return "electric";
  return "electric";
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function text(value: unknown, fallback = "") {
  const output = String(value ?? "").trim();
  return output || fallback;
}

function boolText(value: unknown) {
  const v = normalize(value);
  return v === "true" || v === "yes" || v === "1";
}

function defaultChurnMinutes(driverType: string) {
  return driverType === "diesel" ? "30" : "10";
}

function preferredAnnualMethod(profile: PumpProfile | null) {
  const method = normalize(profile?.test_method_default || "");

  if (method && method !== "no_flow_churn") return method;
  if (boolText(profile?.flow_meter_available)) return "flowmeter";
  if (boolText(profile?.hose_header_available)) return "hose_header";

  return "flow_test";
}

function makePointsForVisit(visitType: unknown, churnMinutes: string): PointState[] {
  const churnPoint: PointState = {
    point_type: "churn",
    label: "Churn / No Flow",
    target_flow_percent: "0",
    target_flow_gpm: "0",
    actual_flow_gpm: "0",
    suction_pressure_psi: "",
    discharge_pressure_psi: "",
    rpm: "",
    run_minutes: churnMinutes,
    notes: "",
  };

  if (!isAnnualVisit(visitType)) {
    return [churnPoint];
  }

  return [
    churnPoint,
    {
      point_type: "rated_100",
      label: "Rated Flow 100%",
      target_flow_percent: "100",
      target_flow_gpm: "",
      actual_flow_gpm: "",
      suction_pressure_psi: "",
      discharge_pressure_psi: "",
      rpm: "",
      run_minutes: "",
      notes: "",
    },
    {
      point_type: "rated_150",
      label: "Rated Flow 150%",
      target_flow_percent: "150",
      target_flow_gpm: "",
      actual_flow_gpm: "",
      suction_pressure_psi: "",
      discharge_pressure_psi: "",
      rpm: "",
      run_minutes: "",
      notes: "",
    },
  ];
}

function pointRequirementText(pointType: string, ratedPressure: number) {
  if (pointType === "churn") {
    const max = ratedPressure ? round1(ratedPressure * 1.4) : 0;

    return max
      ? `Churn pressure should not exceed 140% of rated pressure. الحد المرجعي التقريبي: ${max} PSI`
      : "Churn / No-flow test. أدخل ضغط السحب والطرد ومدة التشغيل.";
  }

  if (pointType === "rated_100") {
    const min = ratedPressure ? round1(ratedPressure * 0.95) : 0;

    return min
      ? `At 100% rated flow, net pressure should be around rated pressure. الحد الأدنى المرجعي: ${min} PSI`
      : "Annual flow point at 100% of rated flow.";
  }

  const min = ratedPressure ? round1(ratedPressure * 0.65) : 0;

  return min
    ? `At 150% rated flow, net pressure should be at least 65% of rated pressure. الحد الأدنى المرجعي: ${min} PSI`
    : "Annual flow point at 150% of rated flow.";
}

function evaluatePoint(point: PointState, ratedPressure: number) {
  const suction = toNumber(point.suction_pressure_psi);
  const discharge = toNumber(point.discharge_pressure_psi);
  const net = round1(discharge - suction);

  if (!suction && !discharge) {
    return {
      net,
      result: "pending",
      label: "غير مكتمل",
      tone: "#64748b",
      bg: "#f8fafc",
      border: "#e2e8f0",
    };
  }

  if (!ratedPressure) {
    return {
      net,
      result: "recorded",
      label: "مسجل",
      tone: "#0f766e",
      bg: "#ecfeff",
      border: "#99f6e4",
    };
  }

  if (point.point_type === "churn") {
    const max = ratedPressure * 1.4;

    if (net > max) {
      return {
        net,
        result: "warning",
        label: "يحتاج مراجعة",
        tone: "#b45309",
        bg: "#fffbeb",
        border: "#facc15",
      };
    }
  }

  if (point.point_type === "rated_100") {
    const min = ratedPressure * 0.95;

    if (net < min) {
      return {
        net,
        result: "fail",
        label: "غير مطابق",
        tone: "#be123c",
        bg: "#fff1f2",
        border: "#fecdd3",
      };
    }
  }

  if (point.point_type === "rated_150") {
    const min = ratedPressure * 0.65;

    if (net < min) {
      return {
        net,
        result: "fail",
        label: "غير مطابق",
        tone: "#be123c",
        bg: "#fff1f2",
        border: "#fecdd3",
      };
    }
  }

  return {
    net,
    result: "pass",
    label: "مقبول",
    tone: "#0f766e",
    bg: "#ecfdf5",
    border: "#bbf7d0",
  };
}

function inputStyle(readOnly = false) {
  return {
    width: "100%",
    border: "1px solid #dbe4ef",
    borderRadius: "14px",
    padding: "10px 11px",
    fontSize: "12px",
    fontWeight: 800,
    color: "#0f172a",
    background: readOnly ? "#f8fafc" : "#fff",
    outline: "none",
  };
}

function labelStyle() {
  return {
    display: "block",
    marginBottom: "5px",
    fontSize: "11px",
    fontWeight: 900,
    color: "#475569",
  };
}

function formatVisitProfile(visitType: unknown, driverType: string) {
  if (isAnnualVisit(visitType)) {
    return "Annual Flow Test / اختبار التدفق السنوي";
  }

  if (driverType === "diesel") {
    return "No-Flow Churn Test / اختبار تشغيل بدون تدفق - ديزل";
  }

  return "No-Flow Churn Test / اختبار تشغيل بدون تدفق - كهرباء";
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
  }>;
  ratedFlow: number;
  ratedPressure: number;
}) {
  const width = 330;
  const height = 210;
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

  const sorted = [...points].sort((a, b) => a.flow - b.flow);
  const polyline = sorted
    .filter((p) => p.pressure > 0)
    .map((p) => `${x(p.flow)},${y(p.pressure)}`)
    .join(" ");

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "12px",
        background: "#fff",
        marginTop: "12px",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: 950,
          color: "#0f172a",
          marginBottom: "8px",
        }}
      >
        منحنى أداء المضخة الحالي
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block" }}
      >
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={height - pad}
          stroke="#cbd5e1"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={height - pad}
          stroke="#cbd5e1"
        />

        <text
          x={width / 2}
          y={height - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
        >
          Flow GPM
        </text>

        <text
          x="12"
          y={height / 2}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          transform={`rotate(-90 12 ${height / 2})`}
        >
          Net PSI
        </text>

        {polyline ? (
          <polyline
            points={polyline}
            fill="none"
            stroke="#0f766e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {sorted.map((p) =>
          p.pressure > 0 ? (
            <g key={p.label}>
              <circle cx={x(p.flow)} cy={y(p.pressure)} r="5" fill="#0f766e" />
              <text
                x={x(p.flow)}
                y={y(p.pressure) - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#0f172a"
              >
                {p.label}
              </text>
            </g>
          ) : null
        )}
      </svg>
    </div>
  );
}

export default function FirePumpTestForm({
  visitId,
  visitSystem,
  visitType = "routine",
}: Props) {
  const router = useRouter();
  const annual = isAnnualVisit(visitType);

  const inferredDriver = inferDriverType(visitSystem.system_code);

  const [profile, setProfile] = useState<PumpProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [pumpTag, setPumpTag] = useState("");
  const [pumpLocation, setPumpLocation] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNo, setSerialNo] = useState("");

  const [driverType, setDriverType] = useState(inferredDriver);
  const [testDate, setTestDate] = useState(todayIso());
  const [testMethod, setTestMethod] = useState(
    annual ? "flow_test" : "no_flow_churn"
  );

  const [ratedFlow, setRatedFlow] = useState("");
  const [ratedPressure, setRatedPressure] = useState("");
  const [ratedRpm, setRatedRpm] = useState("");

  const [electricVoltage, setElectricVoltage] = useState("");
  const [electricAmpL1, setElectricAmpL1] = useState("");
  const [electricAmpL2, setElectricAmpL2] = useState("");
  const [electricAmpL3, setElectricAmpL3] = useState("");

  const [dieselFuelLevel, setDieselFuelLevel] = useState("");
  const [dieselOilPressure, setDieselOilPressure] = useState("");
  const [dieselCoolantTemp, setDieselCoolantTemp] = useState("");
  const [dieselBatteryStatus, setDieselBatteryStatus] = useState("");

  const [generalNotes, setGeneralNotes] = useState("");
  const [points, setPoints] = useState<PointState[]>(() =>
    makePointsForVisit(visitType, defaultChurnMinutes(inferredDriver))
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setProfileLoaded(false);

        const query = new URLSearchParams({
          building_system_id: String(visitSystem.building_system_id || ""),
          system_code: String(visitSystem.system_code || ""),
        });

        const res = await fetch(`/api/fire-pump-profiles?${query.toString()}`);
        const data = await res.json();

        if (cancelled) return;

        const loadedProfile: PumpProfile | null = data?.profile || null;
        setProfile(loadedProfile);

        const nextDriver =
          text(loadedProfile?.driver_type, "") || inferDriverType(visitSystem.system_code);

        const cleanDriver =
          normalize(nextDriver) === "diesel" ? "diesel" : "electric";

        const nextChurnMinutes =
          text(loadedProfile?.churn_run_minutes, "") ||
          defaultChurnMinutes(cleanDriver);

        setDriverType(cleanDriver);
        setPumpTag(text(loadedProfile?.pump_tag, ""));
        setPumpLocation(text(loadedProfile?.pump_location, ""));
        setManufacturer(text(loadedProfile?.manufacturer, ""));
        setModel(text(loadedProfile?.model, ""));
        setSerialNo(text(loadedProfile?.serial_no, ""));
        setRatedFlow(text(loadedProfile?.rated_flow_gpm, ""));
        setRatedPressure(text(loadedProfile?.rated_pressure_psi, ""));
        setRatedRpm(text(loadedProfile?.rated_speed_rpm, ""));

        setTestMethod(
          annual ? preferredAnnualMethod(loadedProfile) : "no_flow_churn"
        );

        setPoints((current) => {
          const fresh = makePointsForVisit(visitType, nextChurnMinutes);

          return fresh.map((point) => {
            const old = current.find((p) => p.point_type === point.point_type);

            return {
              ...point,
              suction_pressure_psi: old?.suction_pressure_psi || "",
              discharge_pressure_psi: old?.discharge_pressure_psi || "",
              rpm: old?.rpm || "",
              actual_flow_gpm: old?.actual_flow_gpm || point.actual_flow_gpm,
              notes: old?.notes || "",
            };
          });
        });
      } catch {
        if (!cancelled) {
          setProfile(null);
          setDriverType(inferredDriver);
          setPoints(makePointsForVisit(visitType, defaultChurnMinutes(inferredDriver)));
        }
      } finally {
        if (!cancelled) {
          setProfileLoaded(true);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [
    annual,
    inferredDriver,
    visitSystem.building_system_id,
    visitSystem.system_code,
    visitType,
  ]);

  const calculated = useMemo(() => {
    return points.map((point) => {
      const targetPercent = toNumber(point.target_flow_percent);
      const computedTargetFlow =
        point.target_flow_gpm ||
        (ratedFlow && targetPercent > 0
          ? String(Math.round((toNumber(ratedFlow) * targetPercent) / 100))
          : point.target_flow_gpm);

      const actualFlow =
        point.actual_flow_gpm ||
        (point.point_type === "churn" ? "0" : computedTargetFlow);

      const evaluation = evaluatePoint(
        {
          ...point,
          target_flow_gpm: computedTargetFlow,
          actual_flow_gpm: actualFlow,
        },
        toNumber(ratedPressure)
      );

      return {
        point,
        targetFlow: computedTargetFlow,
        actualFlow,
        evaluation,
      };
    });
  }, [points, ratedFlow, ratedPressure]);

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
      const churn = points.find((p) => p.point_type === "churn");
      const rated100 = points.find((p) => p.point_type === "rated_100");
      const rated150 = points.find((p) => p.point_type === "rated_150");

      const notesParts = [
        pumpTag ? `Pump tag: ${pumpTag}` : "",
        pumpLocation ? `Location: ${pumpLocation}` : "",
        churn?.run_minutes ? `Run duration: ${churn.run_minutes} minutes` : "",
        generalNotes,
      ].filter(Boolean);

      const res = await fetch("/api/fire-pump-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visit_id: visitId,
          visit_system_id: visitSystem.visit_system_id,
          building_system_id: visitSystem.building_system_id,
          system_code: visitSystem.system_code,

          test_date: testDate,
          test_method: testMethod,
          pump_driver_type: driverType,

          rated_flow_gpm: ratedFlow,
          rated_pressure_psi: ratedPressure,
          rated_speed_rpm: ratedRpm,

          churn_flow_gpm: "0",
          churn_suction_psi: churn?.suction_pressure_psi || "",
          churn_discharge_psi: churn?.discharge_pressure_psi || "",
          churn_rpm: churn?.rpm || "",

          rated_flow_actual_gpm: annual ? rated100?.actual_flow_gpm || "" : "",
          rated_suction_psi: annual ? rated100?.suction_pressure_psi || "" : "",
          rated_discharge_psi: annual ? rated100?.discharge_pressure_psi || "" : "",
          rated_rpm: annual ? rated100?.rpm || "" : "",

          peak_flow_actual_gpm: annual ? rated150?.actual_flow_gpm || "" : "",
          peak_suction_psi: annual ? rated150?.suction_pressure_psi || "" : "",
          peak_discharge_psi: annual ? rated150?.discharge_pressure_psi || "" : "",
          peak_rpm: annual ? rated150?.rpm || "" : "",

          electric_voltage: electricVoltage,
          electric_amp_l1: electricAmpL1,
          electric_amp_l2: electricAmpL2,
          electric_amp_l3: electricAmpL3,

          diesel_fuel_level: dieselFuelLevel,
          diesel_oil_pressure: dieselOilPressure,
          diesel_coolant_temp: dieselCoolantTemp,
          diesel_battery_status: dieselBatteryStatus,

          inspector_notes: notesParts.join(" | "),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ اختبار المضخة");
      }

      setMessage(data.summary || "تم حفظ اختبار المضخة بنجاح.");
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
    flow: toNumber(row.actualFlow),
    pressure: row.evaluation.net,
  }));

  const hasProfile = Boolean(profile?.pump_profile_id || profile?.building_system_id);

  return (
    <div
      className="card"
      style={{
        padding: "14px",
        marginBottom: "14px",
        background: "#f8fafc",
        border: "1px solid #dbeafe",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            width: "54px",
            height: "54px",
            borderRadius: "20px",
            background: "#ecfeff",
            border: "1px solid #99f6e4",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Gauge size={28} color="#0f766e" />
        </div>

        <div>
          <div
            style={{
              fontSize: "12px",
              color: "#0f766e",
              fontWeight: 900,
            }}
          >
            وحدة فحص مضخة الحريق
          </div>

          <div
            style={{
              marginTop: "3px",
              fontSize: "19px",
              fontWeight: 950,
              color: "#0f172a",
              lineHeight: 1.4,
            }}
          >
            {annual
              ? "اختبار التدفق السنوي ومنحنى الأداء"
              : "اختبار التشغيل بدون تدفق / Churn"}
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            {formatVisitProfile(visitType, driverType)}
          </div>
        </div>
      </div>

      <div
        style={{
          border: hasProfile ? "1px solid #99f6e4" : "1px solid #fde68a",
          background: hasProfile ? "#ecfeff" : "#fffbeb",
          borderRadius: "18px",
          padding: "12px",
          marginBottom: "12px",
          fontSize: "13px",
          color: hasProfile ? "#0f766e" : "#92400e",
          lineHeight: 1.8,
          fontWeight: 800,
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <LockKeyhole size={17} />
          <span>
            {profileLoaded
              ? hasProfile
                ? "تم تحميل بيانات المضخة الثابتة من FIRE_PUMP_PROFILES."
                : "لا توجد بيانات ثابتة لهذه المضخة في FIRE_PUMP_PROFILES. أدخل بيانات Rated مؤقتًا هنا، ثم أضف ملف المضخة لاحقًا."
              : "جارٍ تحميل بيانات المضخة الثابتة..."}
          </span>
        </div>
      </div>

      <div
        style={{
          border: "1px solid #e2e8f0",
          background: "#fff",
          borderRadius: "18px",
          padding: "12px",
          marginBottom: "12px",
          fontSize: "13px",
          color: "#334155",
          lineHeight: 1.8,
        }}
      >
        {annual
          ? "هذه زيارة سنوية: أدخل Churn و 100% و 150% لرسم منحنى الأداء وتقييم ضغط المضخة."
          : driverType === "diesel"
          ? "هذه زيارة تشغيل بدون تدفق لمضخة ديزل: المطلوب تشغيل المضخة وتسجيل القراءات الأساسية، ومدة التشغيل المرجعية 30 دقيقة إذا لم يحدد ملف المضخة غير ذلك."
          : "هذه زيارة تشغيل بدون تدفق لمضخة كهربائية: المطلوب تشغيل المضخة وتسجيل القراءات الأساسية، ومدة التشغيل المرجعية 10 دقائق إذا لم يحدد ملف المضخة غير ذلك."}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        <label>
          <span style={labelStyle()}>تاريخ الاختبار</span>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            style={inputStyle()}
          />
        </label>

        <label>
          <span style={labelStyle()}>نوع المحرك</span>
          <input
            value={driverType === "diesel" ? "Diesel" : "Electric"}
            readOnly
            style={inputStyle(true)}
          />
        </label>

        <label>
          <span style={labelStyle()}>رقم / اسم المضخة</span>
          <input
            value={pumpTag}
            onChange={(e) => setPumpTag(e.target.value)}
            placeholder="مثال: FP-01"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>

        <label>
          <span style={labelStyle()}>طريقة الاختبار</span>
          {annual ? (
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value)}
              style={inputStyle()}
            >
              <option value="flow_test">Annual Flow Test</option>
              <option value="flowmeter">Flowmeter</option>
              <option value="hose_header">Hose Header / Pitot</option>
              <option value="closed_loop">Closed Loop</option>
            </select>
          ) : (
            <input value="No-flow / Churn" readOnly style={inputStyle(true)} />
          )}
        </label>

        <label>
          <span style={labelStyle()}>موقع المضخة</span>
          <input
            value={pumpLocation}
            onChange={(e) => setPumpLocation(e.target.value)}
            placeholder="Pump room"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>

        <label>
          <span style={labelStyle()}>الشركة المصنعة</span>
          <input
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Manufacturer"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>

        <label>
          <span style={labelStyle()}>Model</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>

        <label>
          <span style={labelStyle()}>Serial No.</span>
          <input
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            placeholder="Serial"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>

        <label>
          <span style={labelStyle()}>Rated Flow - GPM</span>
          <input
            inputMode="decimal"
            value={ratedFlow}
            onChange={(e) => setRatedFlow(e.target.value)}
            placeholder="مثال: 500"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>

        <label>
          <span style={labelStyle()}>Rated Pressure - PSI</span>
          <input
            inputMode="decimal"
            value={ratedPressure}
            onChange={(e) => setRatedPressure(e.target.value)}
            placeholder="مثال: 100"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>

        <label>
          <span style={labelStyle()}>Rated Speed - RPM</span>
          <input
            inputMode="decimal"
            value={ratedRpm}
            onChange={(e) => setRatedRpm(e.target.value)}
            placeholder="مثال: 2950"
            style={inputStyle(hasProfile)}
            readOnly={hasProfile}
          />
        </label>
      </div>

      <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
        {calculated.map((row, index) => {
          const point = row.point;
          const evaluation = row.evaluation;

          return (
            <div
              key={point.point_type}
              className="card"
              style={{
                padding: "12px",
                background: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      fontWeight: 900,
                    }}
                  >
                    نقطة اختبار
                  </div>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "16px",
                      fontWeight: 950,
                      color: "#0f172a",
                    }}
                  >
                    {point.label}
                  </div>
                </div>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    padding: "7px 10px",
                    fontSize: "12px",
                    fontWeight: 900,
                    background: evaluation.bg,
                    color: evaluation.tone,
                    border: `1px solid ${evaluation.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {evaluation.label}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "8px",
                }}
              >
                <label>
                  <span style={labelStyle()}>Target Flow %</span>
                  <input
                    value={point.target_flow_percent}
                    onChange={(e) =>
                      updatePoint(index, {
                        target_flow_percent: e.target.value,
                      })
                    }
                    inputMode="decimal"
                    style={inputStyle(point.point_type === "churn")}
                    disabled={point.point_type === "churn"}
                  />
                </label>

                <label>
                  <span style={labelStyle()}>Target Flow GPM</span>
                  <input
                    value={row.targetFlow}
                    onChange={(e) =>
                      updatePoint(index, {
                        target_flow_gpm: e.target.value,
                      })
                    }
                    inputMode="decimal"
                    style={inputStyle(point.point_type === "churn")}
                    disabled={point.point_type === "churn"}
                  />
                </label>

                <label>
                  <span style={labelStyle()}>Actual Flow GPM</span>
                  <input
                    value={row.actualFlow}
                    onChange={(e) =>
                      updatePoint(index, {
                        actual_flow_gpm: e.target.value,
                      })
                    }
                    inputMode="decimal"
                    style={inputStyle(point.point_type === "churn")}
                    disabled={point.point_type === "churn"}
                  />
                </label>

                <label>
                  <span style={labelStyle()}>Suction PSI</span>
                  <input
                    value={point.suction_pressure_psi}
                    onChange={(e) =>
                      updatePoint(index, {
                        suction_pressure_psi: e.target.value,
                      })
                    }
                    inputMode="decimal"
                    style={inputStyle()}
                  />
                </label>

                <label>
                  <span style={labelStyle()}>Discharge PSI</span>
                  <input
                    value={point.discharge_pressure_psi}
                    onChange={(e) =>
                      updatePoint(index, {
                        discharge_pressure_psi: e.target.value,
                      })
                    }
                    inputMode="decimal"
                    style={inputStyle()}
                  />
                </label>

                <label>
                  <span style={labelStyle()}>Actual RPM</span>
                  <input
                    value={point.rpm}
                    onChange={(e) =>
                      updatePoint(index, {
                        rpm: e.target.value,
                      })
                    }
                    inputMode="decimal"
                    style={inputStyle()}
                  />
                </label>

                {point.point_type === "churn" ? (
                  <label>
                    <span style={labelStyle()}>مدة التشغيل بالدقائق</span>
                    <input
                      value={point.run_minutes}
                      onChange={(e) =>
                        updatePoint(index, {
                          run_minutes: e.target.value,
                        })
                      }
                      inputMode="decimal"
                      style={inputStyle(Boolean(profile?.churn_run_minutes))}
                      readOnly={Boolean(profile?.churn_run_minutes)}
                    />
                  </label>
                ) : null}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "9px",
                    background: "#f8fafc",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    Net PSI
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 950 }}>
                    {evaluation.net}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "9px",
                    background: "#f8fafc",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    Flow %
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 950 }}>
                    {ratedFlow
                      ? Math.round(
                          (toNumber(row.actualFlow) / toNumber(ratedFlow)) * 100
                        )
                      : 0}
                    %
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "9px",
                    background: "#f8fafc",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    Pressure %
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 950 }}>
                    {ratedPressure
                      ? Math.round(
                          (evaluation.net / toNumber(ratedPressure)) * 100
                        )
                      : 0}
                    %
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  border: "1px solid #fde68a",
                  background: "#fffbeb",
                  color: "#92400e",
                  borderRadius: "14px",
                  padding: "10px",
                  fontSize: "12px",
                  lineHeight: 1.7,
                  fontWeight: 800,
                }}
              >
                {pointRequirementText(point.point_type, toNumber(ratedPressure))}
              </div>

              <textarea
                value={point.notes}
                onChange={(e) =>
                  updatePoint(index, {
                    notes: e.target.value,
                  })
                }
                placeholder="ملاحظات هذه النقطة"
                style={{
                  ...inputStyle(),
                  marginTop: "8px",
                  minHeight: "68px",
                  resize: "vertical",
                }}
              />
            </div>
          );
        })}
      </div>

      {annual ? (
        <PumpCurveChart
          points={chartPoints}
          ratedFlow={toNumber(ratedFlow)}
          ratedPressure={toNumber(ratedPressure)}
        />
      ) : null}

      {driverType === "electric" ? (
        <div
          className="card"
          style={{
            padding: "12px",
            background: "#fff",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 950,
              marginBottom: "8px",
              color: "#0f172a",
            }}
          >
            قراءات كهربائية
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            <label>
              <span style={labelStyle()}>Voltage</span>
              <input
                value={electricVoltage}
                onChange={(e) => setElectricVoltage(e.target.value)}
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={labelStyle()}>Amp L1</span>
              <input
                value={electricAmpL1}
                onChange={(e) => setElectricAmpL1(e.target.value)}
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={labelStyle()}>Amp L2</span>
              <input
                value={electricAmpL2}
                onChange={(e) => setElectricAmpL2(e.target.value)}
                style={inputStyle()}
              />
            </label>

            <label>
              <span style={labelStyle()}>Amp L3</span>
              <input
                value={electricAmpL3}
                onChange={(e) => setElectricAmpL3(e.target.value)}
                style={inputStyle()}
              />
            </label>
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: "12px",
            background: "#fff",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 950,
              marginBottom: "8px",
              color: "#0f172a",
            }}
          >
            قراءات الديزل
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
            }}
          >
            <label>
              <span style={labelStyle()}>Fuel Level</span>
              <input
                value={dieselFuelLevel}
                onChange={(e) => setDieselFuelLevel(e.target.value)}
                style={inputStyle()}
                placeholder="Full / 3/4 / 1/2"
              />
            </label>

            <label>
              <span style={labelStyle()}>Oil Pressure</span>
              <input
                value={dieselOilPressure}
                onChange={(e) => setDieselOilPressure(e.target.value)}
                style={inputStyle()}
                placeholder="PSI"
              />
            </label>

            <label>
              <span style={labelStyle()}>Coolant Temp</span>
              <input
                value={dieselCoolantTemp}
                onChange={(e) => setDieselCoolantTemp(e.target.value)}
                style={inputStyle()}
                placeholder="°C"
              />
            </label>

            <label>
              <span style={labelStyle()}>Battery Status</span>
              <input
                value={dieselBatteryStatus}
                onChange={(e) => setDieselBatteryStatus(e.target.value)}
                style={inputStyle()}
                placeholder="Normal / Weak / Fault"
              />
            </label>
          </div>
        </div>
      )}

      <textarea
        value={generalNotes}
        onChange={(e) => setGeneralNotes(e.target.value)}
        placeholder="ملاحظات عامة على اختبار المضخة"
        style={{
          ...inputStyle(),
          marginTop: "12px",
          minHeight: "78px",
          resize: "vertical",
        }}
      />

      {message ? (
        <div className="alert-success" style={{ marginTop: "12px" }}>
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="alert-error" style={{ marginTop: "12px" }}>
          {error}
        </div>
      ) : null}

      <button
        type="button"
        className="btn btn-grow"
        onClick={savePumpTest}
        disabled={saving}
        style={{
          marginTop: "12px",
          justifyContent: "center",
        }}
      >
        {saving ? (
          <>
            <Activity size={18} />
            جارٍ حفظ اختبار المضخة...
          </>
        ) : (
          <>
            <Save size={18} />
            حفظ اختبار المضخة
          </>
        )}
      </button>

      <div
        style={{
          marginTop: "12px",
          borderTop: "1px solid #e2e8f0",
          paddingTop: "12px",
          fontSize: "12px",
          color: "#64748b",
          lineHeight: 1.7,
        }}
      >
        بعد حفظ اختبار المضخة، أكمل قائمة الفحص المرجعية بالأسفل ثم اضغط حفظ
        النتائج وإقفال الزيارة.
      </div>
    </div>
  );
}
