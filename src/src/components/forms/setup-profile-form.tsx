"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Me } from "@/types/api";

export function SetupProfileForm({ me }: { me: Me }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    desiredRole: "",
    desiredCareerPath: "",
    goal1y: "",
    goal3y: "",
    selfComment: "",
    newPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/me/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "保存に失敗しました");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
      <Field label="希望役割">
        <input
          className="border rounded p-2 w-full"
          value={form.desiredRole}
          onChange={(e) => setForm((v) => ({ ...v, desiredRole: e.target.value }))}
        />
      </Field>

      <Field label="希望キャリアパス">
        <input
          className="border rounded p-2 w-full"
          value={form.desiredCareerPath}
          onChange={(e) => setForm((v) => ({ ...v, desiredCareerPath: e.target.value }))}
        />
      </Field>

      <Field label="1年後の目標">
        <textarea
          className="border rounded p-2 w-full min-h-24"
          value={form.goal1y}
          onChange={(e) => setForm((v) => ({ ...v, goal1y: e.target.value }))}
        />
      </Field>

      <Field label="3年後の目標">
        <textarea
          className="border rounded p-2 w-full min-h-24"
          value={form.goal3y}
          onChange={(e) => setForm((v) => ({ ...v, goal3y: e.target.value }))}
        />
      </Field>

      <Field label="自己コメント">
        <textarea
          className="border rounded p-2 w-full min-h-24"
          value={form.selfComment}
          onChange={(e) => setForm((v) => ({ ...v, selfComment: e.target.value }))}
        />
      </Field>

      <Field label="新しいパスワード">
        <input
          type="password"
          className="border rounded p-2 w-full"
          value={form.newPassword}
          onChange={(e) => setForm((v) => ({ ...v, newPassword: e.target.value }))}
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存してはじめる"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      {children}
    </div>
  );
}