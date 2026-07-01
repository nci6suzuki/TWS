// src/components/employees/delete-qualification-button.tsx

"use client";

import { DeleteActionButton } from "@/components/ui/delete-action-button";

export function DeleteQualificationButton({
  employeeCode,
  qualificationId,
  returnTo,
  label = "削除",
}: {
  employeeCode: string;
  qualificationId: string;
  returnTo?: string;
  label?: string;
}) {
  return (
    <DeleteActionButton
      pendingText="削除中..."
      confirmMessage={
        "この資格情報を削除します。\n削除すると元に戻せません。よろしいですか？"
      }
      onDelete={async () => {
        const safeReturnTo =
          returnTo ?? `/employees/code/${employeeCode}/qualifications`;

        const formData = new FormData();
        formData.append("employeeCode", employeeCode);
        formData.append("returnTo", safeReturnTo);

        const res = await fetch(
          `/api/employee-qualifications/${qualificationId}/delete`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "資格情報の削除に失敗しました");
        }

        window.location.href = `${safeReturnTo}?deleted=資格情報`;
      }}
    >
      {label}
    </DeleteActionButton>
  );
}