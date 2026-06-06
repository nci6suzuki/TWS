"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const form = new FormData();
    form.append("email", email);
    form.append("password", password);

    const res = await fetch("/api/auth/login", { method: "POST", body: form });
    // route側がredirectするので、ここでは location を追従
    if (res.redirected) window.location.href = res.url;
    else setMsg("ログインに失敗しました");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border bg-white p-6 space-y-4">
        <div className="text-xl font-bold">ログイン</div>
        <input className="w-full rounded-xl border p-3" placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded-xl border p-3" placeholder="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {msg && <div className="text-sm text-rose-600">{msg}</div>}
        <button className="w-full h-11 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">
          ログイン
        </button>
      </form>
    </div>
  );
}