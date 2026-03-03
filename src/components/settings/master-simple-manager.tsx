"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type MasterItem = {
  id: string;
  name: string;
  code?: string | null;
  sort_order?: number | null;
  category?: string | null;
  branch_id?: string | null;
  branches?: { name?: string } | null;
};

export function MasterSimpleManager({
  title,
  fetchUrl,
  createUrl,
  updateUrlBase,
  fields,
}: {
  title: string;
  fetchUrl: string;
  createUrl: string;
  updateUrlBase: string;
  fields: Array<{
    key: string;
    label: string;
    type?: "text" | "number";
  }>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<MasterItem[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<Record<string, any>>({});

  async function load() {
    const res = await fetch(fetchUrl);
    const json = await res.json();
    setItems(json?.data?.items ?? []);
  }

  useEffect(() => {
    load();
  }, [fetchUrl]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(createUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      alert(json?.error?.message ?? "登録に失敗しました");
      return;
    }

    setForm({});
    await load();
    router.refresh();
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`${updateUrlBase}/${id}`, {
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
    setEditingForm({});
    await load();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("削除しますか？")) return;

    const res = await fetch(`${updateUrlBase}/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      alert(json?.error?.message ?? "削除に失敗しました");
      return;
    }

    await load();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>

      <form onSubmit={handleCreate} className="border rounded p-4 space-y-3">
        <div className="font-medium text-sm">新規追加</div>

        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <div className="text-sm">{field.label}</div>
            <input
              type={field.type ?? "text"}
              className="border rounded p-2 w-full"
              value={form[field.key] ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [field.key]:
                    field.type === "number" ? Number(e.target.value) : e.target.value,
                }))
              }
            />
          </div>
        ))}

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
                      {fields.map((field) => (
                        <div key={field.key} className="space-y-1">
                          <div className="text-sm">{field.label}</div>
                          <input
                            type={field.type ?? "text"}
                            className="border rounded p-2 w-full"
                            value={editingForm[field.key] ?? ""}
                            onChange={(e) =>
                              setEditingForm((prev) => ({
                                ...prev,
                                [field.key]:
                                  field.type === "number" ? Number(e.target.value) : e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate(item.id)}
                          className="px-3 py-2 rounded border bg-black text-white text-sm"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingForm({});
                          }}
                          className="px-3 py-2 rounded border text-sm"
                        >
                          キャンセル
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm space-y-1">
                        {fields.map((field) => (
                          <div key={field.key}>
                            <span className="font-medium">{field.label}：</span>
                            {String((item as any)[field.key] ?? "")}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingForm(
                              fields.reduce((acc, field) => {
                                acc[field.key] = (item as any)[field.key] ?? "";
                                return acc;
                              }, {} as Record<string, any>)
                            );
                          }}
                          className="text-sm underline"
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
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