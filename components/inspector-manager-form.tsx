"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type InspectorRow = {
  inspector_id: string;
  inspector_code: string;
  full_name: string;
  full_name_ar: string;
  employer_name: string;
  phone: string;
  email: string;
  national_id_or_iqama: string;
  region_base: string;
  status: string;
  notes: string;
  app_user_id: string;
  allowed_systems: string;
};

type UserOption = {
  app_user_id: string;
  full_name: string;
  email: string;
};

type SystemOption = {
  system_code: string;
  system_name: string;
};

type Props = {
  inspectors: InspectorRow[];
  users: UserOption[];
  systems: SystemOption[];
};

type FormState = {
  inspector_id: string;
  inspector_code: string;
  full_name: string;
  full_name_ar: string;
  employer_name: string;
  phone: string;
  email: string;
  national_id_or_iqama: string;
  region_base: string;
  status: string;
  notes: string;
  app_user_id: string;
  allowed_systems: string[];
};

const initialState: FormState = {
  inspector_id: "",
  inspector_code: "",
  full_name: "",
  full_name_ar: "",
  employer_name: "",
  phone: "",
  email: "",
  national_id_or_iqama: "",
  region_base: "",
  status: "active",
  notes: "",
  app_user_id: "",
  allowed_systems: [],
};

function parseAllowedSystems(value: string) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function InspectorManagerForm({
  inspectors,
  users,
  systems,
}: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>(initialState);

  const sortedInspectors = useMemo(() => {
    return [...inspectors].sort((a, b) =>
      String(a.full_name_ar || a.full_name).localeCompare(
        String(b.full_name_ar || b.full_name),
        "ar"
      )
    );
  }, [inspectors]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(initialState);
    setEditingId("");
    setMessage("");
    setError("");
  }

  function startCreate() {
    resetForm();
    setOpen(true);
  }

  function startEdit(row: InspectorRow) {
    setEditingId(String(row.inspector_id));
    setForm({
      inspector_id: String(row.inspector_id || ""),
      inspector_code: String(row.inspector_code || ""),
      full_name: String(row.full_name || ""),
      full_name_ar: String(row.full_name_ar || ""),
      employer_name: String(row.employer_name || ""),
      phone: String(row.phone || ""),
      email: String(row.email || ""),
      national_id_or_iqama: String(row.national_id_or_iqama || ""),
      region_base: String(row.region_base || ""),
      status: String(row.status || "active"),
      notes: String(row.notes || ""),
      app_user_id: String(row.app_user_id || ""),
      allowed_systems: parseAllowedSystems(String(row.allowed_systems || "")),
    });
    setMessage("");
    setError("");
    setOpen(true);
  }

  function toggleSystem(systemCode: string) {
    setForm((prev) => {
      const exists = prev.allowed_systems.includes(systemCode);
      return {
        ...prev,
        allowed_systems: exists
          ? prev.allowed_systems.filter((x) => x !== systemCode)
          : [...prev.allowed_systems, systemCode],
      };
    });
  }

  const canSubmit =
    form.full_name.trim() &&
    form.email.trim() &&
    form.status.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!canSubmit) {
        throw new Error("أكمل الحقول الأساسية: الاسم، البريد، الحالة.");
      }

      const payload = {
        inspector_code: form.inspector_code,
        full_name: form.full_name,
        full_name_ar: form.full_name_ar,
        employer_name: form.employer_name,
        phone: form.phone,
        email: form.email,
        national_id_or_iqama: form.national_id_or_iqama,
        region_base: form.region_base,
        status: form.status,
        notes: form.notes,
        app_user_id: form.app_user_id,
        allowed_systems: form.allowed_systems.join(","),
      };

      const endpoint = editingId
        ? `/api/inspectors/${encodeURIComponent(editingId)}`
        : "/api/inspectors";

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر حفظ المفتش");
      }

      setMessage(editingId ? "تم تحديث المفتش" : "تمت إضافة المفتش");
      resetForm();
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر حفظ المفتش");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div className="section-header-row">
        <div>
          <div className="section-title">سجل المفتشين</div>
          <div className="section-subtitle">
            أضف مفتشًا جديدًا أو عدّل الأنظمة المسموحة لمفتش موجود
          </div>
        </div>

        <button type="button" className="btn" onClick={startCreate}>
          {open ? "فتح النموذج" : "إضافة مفتش"}
        </button>
      </div>

      {message ? (
        <div className="alert-success" style={{ marginTop: "12px" }}>
          {message}
        </div>
      ) : null}

      {open ? (
        <form onSubmit={handleSubmit} className="stack-3" style={{ marginTop: "16px" }}>
          <div className="form-grid-2">
            <input
              className="field"
              placeholder="الاسم بالإنجليزية *"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
            />
            <input
              className="field"
              placeholder="الاسم بالعربية"
              value={form.full_name_ar}
              onChange={(e) => updateField("full_name_ar", e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <input
              className="field"
              placeholder="كود المفتش"
              value={form.inspector_code}
              onChange={(e) => updateField("inspector_code", e.target.value)}
            />
            <input
              className="field"
              placeholder="جهة العمل"
              value={form.employer_name}
              onChange={(e) => updateField("employer_name", e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <input
              className="field"
              placeholder="الجوال"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
            <input
              className="field"
              placeholder="البريد الإلكتروني *"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <input
              className="field"
              placeholder="الهوية / الإقامة"
              value={form.national_id_or_iqama}
              onChange={(e) =>
                updateField("national_id_or_iqama", e.target.value)
              }
            />
            <input
              className="field"
              placeholder="المنطقة"
              value={form.region_base}
              onChange={(e) => updateField("region_base", e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <select
              className="field"
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>

            <select
              className="field"
              value={form.app_user_id}
              onChange={(e) => updateField("app_user_id", e.target.value)}
            >
              <option value="">ربط بحساب مستخدم اختياريًا</option>
              {users.map((user) => (
                <option key={user.app_user_id} value={user.app_user_id}>
                  {user.full_name || user.email} · {user.email}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="field"
            placeholder="ملاحظات"
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          <div className="system-panel">
            <div className="system-panel-top">
              <div>
                <div className="system-panel-title">الأنظمة المسموحة</div>
                <div className="system-panel-count">
                  المحدد: {form.allowed_systems.length}
                </div>
              </div>
            </div>

            <div className="system-pick-list">
              {systems.map((system) => {
                const checked = form.allowed_systems.includes(system.system_code);

                return (
                  <label
                    key={system.system_code}
                    className={`system-pick-item ${checked ? "checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSystem(system.system_code)}
                    />
                    <div>
                      <div className="system-pick-item-title">
                        {system.system_name}
                      </div>
                      <div className="system-pick-item-code">
                        {system.system_code}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="helper-text" style={{ marginTop: "10px" }}>
              إذا تركت الأنظمة المسموحة فارغة، سيُعتبر المفتش صالحًا لكل الأنظمة.
            </div>
          </div>

          {error ? <div className="alert-error">{error}</div> : null}

          <div className="btn-row">
            <button type="submit" className="btn btn-grow" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "إضافة المفتش"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}

      <div className="stack-3" style={{ marginTop: "16px" }}>
        {sortedInspectors.map((row) => (
          <div key={row.inspector_id} className="building-block">
            <div className="building-block-top">
              <div>
                <div className="building-block-title">
                  {row.full_name_ar || row.full_name || "مفتش"}
                </div>
                <div className="building-block-sub">
                  {row.email || "-"}
                  {row.phone ? ` · ${row.phone}` : ""}
                </div>
              </div>

              <div className="badge-wrap">
                <span className="badge">{row.status || "active"}</span>
                {row.app_user_id ? (
                  <span className="badge">Linked: {row.app_user_id}</span>
                ) : null}
              </div>
            </div>

            <div className="building-block-section">
              <div className="building-block-section-title">الأنظمة المسموحة</div>
              {String(row.allowed_systems || "").trim() ? (
                <div className="badge-wrap">
                  {parseAllowedSystems(row.allowed_systems).map((code) => (
                    <span key={code} className="badge">
                      {code}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="muted-note">جميع الأنظمة</div>
              )}
            </div>

            <div className="btn-row" style={{ marginTop: "12px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => startEdit(row)}
              >
                تعديل
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
