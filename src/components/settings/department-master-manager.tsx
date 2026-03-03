"use client";

import { useEffect, useState } from "react";

type Branch = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
  branch_id: string;
  branches?: { name?: string } | null;
};

export function DepartmentMasterManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [items, setItems] = useState<Department[]>([]);
  const [form, setForm] = useState({ name: "", branchId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({ name: "", branchId: "" });

  async function loadAll() {
    const [branchRes, deptRes] = await Promise.all([
      fetch("/api/masters/branches"),
      fetch("/api/masters/departments"),
    ]);

    const branchJson = await branchRes.json();
    const deptJson = await deptRes.json();

    setBranches(branchJson?.data?.items ?? []);
    setItems(deptJson?.data?.items ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createDepartment(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/masters/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      alert(json?.error?.message ?? "登録に失敗しました");
      return;
    }

    setForm({ name: "", branchId: "" });
    await loadAll();
  }

  async function updateDepartment(id: string) {
    const res = await fetch(`/api/masters/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingForm),
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      alert(json?.error?.message ?? "更新に失敗しました");
      return;
    }

    setEditingId(null);
    setEditingForm({ name: "", branchId: "" });
    await loadAll();
  }

  async function deleteDepartment(id: string) {
    if (!confirm("削除しますか？")) return;

    const res = await fetch(`/api/masters/departments/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      alert(json?.error?.message ?? "削除に失敗しました");
      return;
    }

    await loadAll();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">部署マスタ</h1>

      <form onSubmit={createDepartment} className="border rounded p-4 space-y-3">
        <div className="font-medium text-sm">新規追加</div>

        <input
          className="border rounded p-2 w-full"
          placeholder="部署名"
          value={form.name}
          onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
        />

        <select
          className="border rounded p-2 w-full"
          value={form.branchId}
          onChange={(e) => setForm((v) => ({ ...v, branchId: e.target.value }))}
        >
          <option value="">支店を選択</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <button type="submit" className="px-4 py-2 rounded border bg-black text-white text-sm">
          追加する
        </button>
      </form>

      <div className="border rounded">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">データがありません。</div>
        ) : (
          <ul>
            {items.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <li key={item.id} className="p-4 border-b last:border-b-0 space-y-3">
                  {isEditing ? (
                    <>
                      <input
                        className="border rounded p-2 w-full"
                        value={editingForm.name}
                        onChange={(e) =>
                          setEditingForm((v) => ({ ...v, name: e.target.value }))
                        }
                      />

                      <select
                        className="border rounded p-2 w-full"
                        value={editingForm.branchId}
                        onChange={(e) =>
                          setEditingForm((v) => ({ ...v, branchId: e.target.value }))
                        }
                      >
                        <option value="">支店を選択</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateDepartment(item.id)}
                          className="px-3 py-2 rounded border bg-black text-white text-sm"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingForm({ name: "", branchId: "" });
                          }}
                          className="px-3 py-2 rounded border text-sm"
                        >
                          キャンセル
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm">
                        <div><span className="font-medium">部署名：</span>{item.name}</div>
                        <div><span className="font-medium">支店：</span>{item.branches?.name ?? "-"}</div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingForm({
                              name: item.name,
                              branchId: item.branch_id,
                            });
                          }}
                          className="text-sm underline"
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteDepartment(item.id)}
                          className="text-sm underline text-red-600"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}