// src/components/notifications/read-and-open-button.tsx

"use client";

import { useState } from "react";
import { buttonClassName } from "@/lib/ui/button-class";

export function ReadAndOpenButton({
  href,
  label = "開いて既読",
}: {
  href: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      aria-disabled={loading}
      onClick={() => {
        if (loading) return;

        setLoading(true);
        window.location.href = href;
      }}
      className={buttonClassName(
        "inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700",
        {
          loading,
        }
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          移動中...
        </span>
      ) : (
        label
      )}
    </button>
  );
}