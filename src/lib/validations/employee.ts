import { z } from "zod";

const uuidSchema = z.string().uuid("UUID形式が不正です");

const uuidOrEmpty = z
  .string()
  .trim()
  .optional()
  .transform((value: string | undefined) => {
    if (!value) return undefined;
    return value;
  })
  .refine((value: string | undefined) => value === undefined || uuidSchema.safeParse(value).success, {
    message: "UUID形式が不正です",
  });

const employmentTypeSchema = z
  .string()
  .trim()
  .refine((value: string) => ["full_time", "contract", "part_time", "other"].includes(value), {
    message: "雇用区分の指定が不正です",
  });

const employeeStatusSchema = z
  .string()
  .trim()
  .refine((value: string) => ["active", "leave", "inactive"].includes(value), {
    message: "在籍状態の指定が不正です",
  });

export const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().min(1).email(),

  branchId: z.string().uuid("支店の指定が不正です"),
  departmentId: z.string().uuid("部署の指定が不正です"),
  positionId: z.string().uuid("役職の指定が不正です"),

  gradeId: uuidOrEmpty, // ★ここだけ変更

  employmentType: employmentTypeSchema,
  hireDate: z.string().trim().min(1).refine(v => !Number.isNaN(Date.parse(v)), { message: "入社日の形式が不正です" }),

  managerEmployeeId: uuidOrEmpty,
  mentorEmployeeId: uuidOrEmpty,
  status: employeeStatusSchema,
  templateId: uuidOrEmpty.nullable().optional(),
  hrEmployeeId: uuidOrEmpty,
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;