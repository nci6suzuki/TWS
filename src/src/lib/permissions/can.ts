// src/lib/permissions/can.ts
import { Me, Role } from "@/types/api";

export function isAdminOrHr(role: Role) {
  return role === "admin" || role === "hr";
}

export function canViewEmployee(
  me: Me,
  targetEmployeeId: string,
  targetDepartmentId?: string,
  targetBranchId?: string
) {
  if (isAdminOrHr(me.role)) return true;

  if (me.role === "employee") {
    return me.employeeId === targetEmployeeId;
  }

  if (me.role === "mentor") {
    return me.scope?.employeeIds?.includes(targetEmployeeId) ?? false;
  }

  if (me.role === "manager") {
    if (targetDepartmentId && me.scope?.departmentIds?.includes(targetDepartmentId)) return true;
    if (targetBranchId && me.scope?.branchIds?.includes(targetBranchId)) return true;
    return false;
  }

  return false;
}

export function canEditEmployeeBase(me: Me) {
  return isAdminOrHr(me.role);
}

export function canEditCareerGoals(me: Me, targetEmployeeId: string) {
  if (isAdminOrHr(me.role)) return true;
  if (me.role === "employee" && me.employeeId === targetEmployeeId) return true;
  return false;
}

export function canCreateInterview(me: Me) {
  return ["admin", "hr", "manager", "mentor"].includes(me.role);
}

export function canViewInterview(
  me: Me,
  visibility: "self" | "manager" | "hr" | "private_hr",
  targetEmployeeId: string,
  targetDepartmentId?: string,
  targetBranchId?: string
) {
  if (isAdminOrHr(me.role)) return true;

  if (visibility === "private_hr") return false;

  if (me.role === "employee") {
    return visibility === "self" && me.employeeId === targetEmployeeId;
  }

  if (me.role === "mentor") {
    return (
      (visibility === "self" || visibility === "manager") &&
      (me.scope?.employeeIds?.includes(targetEmployeeId) ?? false)
    );
  }

  if (me.role === "manager") {
    if (visibility !== "self" && visibility !== "manager") return false;

    if (targetDepartmentId && me.scope?.departmentIds?.includes(targetDepartmentId)) return true;
    if (targetBranchId && me.scope?.branchIds?.includes(targetBranchId)) return true;
    return false;
  }

  return false;
}

export function canManageTemplates(me: Me) {
  return me.role === "admin" || me.role === "hr";
}

export function canManageQualifications(me: Me) {
  return me.role === "admin" || me.role === "hr";
}

export function canManageAnnualEvents(me: Me) {
  return ["admin", "hr", "manager"].includes(me.role);
}