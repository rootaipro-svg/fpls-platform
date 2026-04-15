"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap min-h-screen flex items-center">
      <div className="card w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-500">Professional field inspections</div>
          <h1 className="text-2xl font-bold">Sign in</h1>
        </div>
        <div className="space-y-3">
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button className="btn w-full" onClick={submit} disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
        </div>
      </div>
    </main>
  );
}
