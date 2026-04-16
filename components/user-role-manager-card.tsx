"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRoleBadge } from "@/components/user-role-badge";
import { AccountStatusBadge } from "@/components/account-status-badge";

type Props = {
  userRow: any;
};

export default function UserRoleManagerCard({ userRow }: Props) {
  const router = useRouter();

  const [role, setRole] = useState(
    String(userRow.role || userRow.user_role || "inspector").toLowerCase()
  );
  const [status, setStatus] = useState(
    String(userRow.account_status || userRow.status || "active").toLowerCase()
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/settings/users/${userRow.app_user_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          account_status: status,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "تعذر تحديث المستخدم");
      }

      setMessage("تم تحديث بيانات المستخدم");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "تعذر تحديث المستخدم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="user-card">
      <div className="user-card-top">
        <div>
          <div className="user-card-title">
            {String(userRow.full_name || userRow.name || "مستخدم")}
          </div>
          <div className="user-card-sub">
            {String(userRow.email || "-")}
          </div>
          <div className="user-card-sub">
            App User ID: {String(userRow.app_user_id || "-")}
          </div>
        </div>

        <div className="user-card-meta">
          <UserRoleBadge role={String(role)} />
          <AccountStatusBadge status={String(status)} />
        </div>
      </div>

      <div className="user-form-grid">
        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="admin">admin</option>
          <option value="reviewer">reviewer</option>
          <option value="inspector">inspector</option>
        </select>

        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">active</option>
          <option value="disabled">disabled</option>
        </select>
      </div>

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

      <div className="btn-row" style={{ marginTop: "12px" }}>
        <button className="btn btn-grow" onClick={handleSave} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ الصلاحية"}
        </button>
      </div>
    </div>
  );
}
