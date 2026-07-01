// src/components/employees/delete-interview-button.tsx

"use client";

import { DeleteActionButton } from "@/components/ui/delete-action-button";

export function DeleteInterviewButton({
  employeeCode,
  interviewId,
  returnTo,
  label = "削除",
}: {
  employeeCode: string;
  interviewId: string;
  returnTo?: string;
  label?: string;
}) {
  return (
    <DeleteActionButton
      pendingText="削除中..."
      confirmMessage={
        "この面談記録を削除します。\n関連する年間イベントも削除される場合があります。よろしいですか？"
      }
      onDelete={async () => {
        const safeReturnTo =
          returnTo ?? `/employees/code/${employeeCode}/interviews`;

        const formData = new FormData();
        formData.append("employeeCode", employeeCode);
        formData.append("returnTo", safeReturnTo);

        const res = await fetch(`/api/employee-interviews/${interviewId}/delete`, {
          method: "POST",
          body: formData,
        });

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "面談記録の削除に失敗しました");
        }

        window.location.href = `${safeReturnTo}?deleted=面談記録`;
      }}
    >
      {label}
    </DeleteActionButton>
  );
}