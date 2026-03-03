// src/lib/validations/interview.ts
import { z } from "zod";

export const createInterviewSchema = z.object({
  employeeId: z.string().uuid(),
  interviewerEmployeeId: z.string().uuid(),
  interviewDate: z.string().min(1),
  interviewType: z.enum(["retention", "career", "performance", "care", "other"]),
  assignmentId: z.string().uuid().optional(),
  annualEventId: z.string().uuid().optional(),
  factsObserved: z.string().max(5000).optional(),
  employeeVoice: z.string().max(5000).optional(),
  positivePoints: z.string().max(5000).optional(),
  issues: z.string().max(5000).optional(),
  responsePolicy: z.string().max(5000).optional(),
  actionEmployee: z.string().max(5000).optional(),
  actionCompany: z.string().max(5000).optional(),
  nextInterviewDate: z.string().optional(),
  visibility: z.enum(["self", "manager", "hr", "private_hr"]),
  autoCompleteAssignment: z.boolean().optional(),
  autoCompleteAnnualEvent: z.boolean().optional(),
}).refine((v) => {
  const body =
    (v.factsObserved ?? "") +
    (v.employeeVoice ?? "") +
    (v.positivePoints ?? "") +
    (v.issues ?? "") +
    (v.responsePolicy ?? "");
  return body.trim().length > 0;
}, {
  message: "面談内容（事実/発言/良かった点/課題/方針）のいずれかを入力してください。",
});