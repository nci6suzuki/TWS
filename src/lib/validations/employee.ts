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
  employeeCode: z
    .string()
    .trim()
    .min(1, "社員番号は必須です")
    .max(50, "社員番号は50文字以内で入力してください"),
  name: z
    .string()
    .trim()
    .min(1, "氏名は必須です")
    .max(120, "氏名は120文字以内で入力してください"),
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスは必須です")
    .email("メールアドレスの形式が不正です"),
  branchId: z.string().uuid("支店の指定が不正です"),
  departmentId: z.string().uuid("部署の指定が不正です"),
  positionId: z.string().uuid("役職の指定が不正です"),
  gradeId: z.string().uuid("等級の指定が不正です"),
  employmentType: employmentTypeSchema,
  hireDate: z
    .string()
    .trim()
    .min(1, "入社日は必須です")
    .refine((value: string) => !Number.isNaN(Date.parse(value)), {
      message: "入社日の形式が不正です",
    }),
  managerEmployeeId: uuidOrEmpty,
  mentorEmployeeId: uuidOrEmpty,
  status: employeeStatusSchema,
  templateId: uuidOrEmpty.nullable().optional(),
  hrEmployeeId: uuidOrEmpty,
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;