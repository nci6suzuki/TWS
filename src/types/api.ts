// src/types/api.ts

export type Role = "admin" | "hr" | "manager" | "mentor" | "employee";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============ Me ============
export type Me = {
  userId: string;
  employeeId: string;
  role: Role;
  // 例：manager の閲覧範囲
  scope?: {
    branchIds?: string[];
    departmentIds?: string[];
    employeeIds?: string[]; // mentor担当など
  };
};

// ============ Employees ============
export type EmployeeListItem = {
  id: string;
  userId?: string | null;
  employeeCode: string;
  name: string;
  email?: string | null;
  branchName: string;
  departmentName?: string;
  positionName?: string;
  gradeName?: string;
  managerName?: string;
  nextInterviewDate?: string | null;
  followupStatus?: "normal" | "needs_followup";
  qualificationDueOn?: string | null;
  lastInvitedAt?: string | null;
  invitedByName?: string | null;
  status: "active" | "inactive" | "leave";
};

export type GetEmployeesQuery = {
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  gradeId?: string;
  keyword?: string;
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
};

export type GetEmployeesRes = {
  items: EmployeeListItem[];
  pagination: Pagination;
};

export type EmployeeSummary = {
  id: string;
  employeeCode: string;
  name: string;
  branchName: string;
  departmentName?: string;
  positionName?: string;
  gradeName?: string;
  hireDate?: string;
  managerEmployeeId?: string | null;
  mentorEmployeeId?: string | null;
  nextInterviewDate?: string | null;
  qualificationDueOn?: string | null;
  alerts?: { type: string; message: string }[];
};

// ============ Followups ============
export type FollowupStatus = "pending" | "in_progress" | "done" | "overdue";

export type FollowupListItem = {
  id: string;
  fiscalYear: number;
  quarter: 1 | 2 | 3 | 4;
  employeeId: string;
  employeeName: string;
  branchName: string;
  followupType: "retention" | "career" | "performance" | "care";
  assigneeEmployeeId: string;
  assigneeName: string;
  dueDate: string; // YYYY-MM-DD
  status: FollowupStatus;
  priority: 1 | 2 | 3; // 1高,2中,3低
  lastInterviewDate?: string | null;
};

export type GetFollowupsQuery = {
  fiscalYear?: number;
  quarter?: 1 | 2 | 3 | 4;
  status?: FollowupStatus;
  assigneeEmployeeId?: string;
  employeeId?: string;
  branchId?: string;
  page: number;
  limit: number;
};

export type GetFollowupsRes = {
  items: FollowupListItem[];
  pagination: Pagination;
};

export type FollowupDetail = FollowupListItem & {
  note?: string | null;
};

// ============ Interviews ============
export type InterviewVisibility = "self" | "manager" | "hr" | "private_hr";

export type InterviewRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  interviewerEmployeeId: string;
  interviewerName: string;
  interviewDate: string; // ISO
  interviewType: "retention" | "career" | "performance" | "care" | "other";
  assignmentId?: string | null;
  factsObserved?: string | null;
  employeeVoice?: string | null;
  positivePoints?: string | null;
  issues?: string | null;
  responsePolicy?: string | null;
  actionEmployee?: string | null;
  actionCompany?: string | null;
  nextInterviewDate?: string | null;
  visibility: InterviewVisibility;
  createdAt: string;
  updatedAt: string;
};

export type CreateInterviewReq = {
  employeeId: string;
  interviewerEmployeeId: string;
  interviewDate: string;
  interviewType: InterviewRecord["interviewType"];
  assignmentId?: string;
  annualEventId?: string;
  factsObserved?: string;
  employeeVoice?: string;
  positivePoints?: string;
  issues?: string;
  responsePolicy?: string;
  actionEmployee?: string;
  actionCompany?: string;
  nextInterviewDate?: string;
  visibility: InterviewVisibility;
  autoCompleteAssignment?: boolean;
  autoCompleteAnnualEvent?: boolean;
};

export type CreateInterviewRes = { id: string };