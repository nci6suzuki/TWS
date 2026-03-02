// src/lib/permissions/can.ts
import { Me, Role } from "@/types/api";

export function isAdminOrHr(role: Role) {
  return role === "admin" || role === "hr";
}

/**
 * employee（対象社員）を閲覧できるか？
 * - admin/hr: 全社
 * - manager: 自部署（scope.departmentIds 等） or 自分の部下（将来）
 * - mentor: 担当者（scope.employeeIds）
 * - employee: 自分のみ
 */
export function canViewEmployee(me: Me, targetEmployeeId: string, targetDepartmentId?: string, targetBranchId?: string) {
  if (me.role === "admin" || me.role === "hr") return true;
  if (me.role === "employee") return me.employeeId === targetEmployeeId;

  // mentor: 担当社員
  if (me.role === "mentor") {
    return me.scope?.employeeIds?.includes(targetEmployeeId) ?? false;
  }

  // manager: 自部署/支店範囲
  if (me.role === "manager") {
    if (targetDepartmentId && me.scope?.departmentIds?.includes(targetDepartmentId)) return true;
    if (targetBranchId && me.scope?.branchIds?.includes(targetBranchId)) return true;
    return false;
  }

  return false;
}

export function canEditEmployeeBase(me: Me) {
  return me.role === "admin" || me.role === "hr";
}

export function canCreateInterview(me: Me) {
  return me.role === "admin" || me.role === "hr" || me.role === "manager" || me.role === "mentor";
}

export function canViewInterview(me: Me, visibility: "self" | "manager" | "hr" | "private_hr", targetEmployeeId: string, isManagerOfTarget?: boolean) {
  if (me.role === "admin" || me.role === "hr") return true;
  if (visibility === "private_hr") return false;

  if (me.role === "employee") {
    return visibility === "self" && me.employeeId === targetEmployeeId;
  }

  if (me.role === "manager") {
    // ここは運用で決める：部下ならOK、など
    return (visibility === "manager" || visibility === "self") && !!isManagerOfTarget;
  }

  if (me.role === "mentor") {
    // mentorは self公開 or 運用で mentor公開 を追加しても良い
    return visibility === "self"; // 最小運用
  }

  return false;
}