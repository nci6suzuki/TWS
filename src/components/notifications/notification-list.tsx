// src/components/notifications/notification-list.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  related_table: string | null;
  related_id: string | null;
};

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  async function markRead(id: string) {
    setLoadingIds((v) => [...v, id]);

    try {
      const res = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error("既読化に失敗しました");

      router.refresh();
    } catch (e) {
      alert("既読化に失敗しました");
    } finally {
      setLoadingIds((v) => v.filter((x) => x !== id));
    }
  }

  if (items.length === 0) {
    return <div className="text-sm text-gray-600">通知はありません。</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`border rounded p-4 ${item.is_read ? "bg-white" : "bg-yellow-50"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">{item.title}</div>
              {item.body && <div className="text-sm text-gray-600 mt-1">{item.body}</div>}
              <div className="text-xs text-gray-500 mt-2">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>

            {!item.is_read && (
              <button
                onClick={() => markRead(item.id)}
                disabled={loadingIds.includes(item.id)}
                className="text-xs underline"
              >
                {loadingIds.includes(item.id) ? "更新中..." : "既読"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}