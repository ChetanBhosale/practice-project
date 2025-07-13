import z from "zod";
import { Roles } from "@repo/common";

const objectId = () =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: "Invalid ObjectId format",
  });

export const ZUser = z.object({
  _id: objectId().optional(),
  name: z.string().optional(),
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  password: z.string().min(6),
  role: z.enum([Roles.admin, Roles.employee]).default(Roles.employee),
  isVerified: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ZUserCompany = z.object({
  _id: objectId().optional(),
  userId: objectId(),
  companyId: objectId(),
  role: z.enum([Roles.admin, Roles.employee]).default(Roles.employee),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ZCompany = z.object({
  _id: objectId().optional(),
  name: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9\s]+$/),
  address: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ZCompanyDocs = z.object({
  _id: objectId().optional(),
  companyId: objectId(),
  filedata: z.string().optional(),
  isEmbedded: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ZQuestionAnswer = z.object({
  _id: objectId().optional(),
  userId: objectId(),
  companyId: objectId(),
  question: z.string().min(1),
  answer: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ZOtp = z.object({
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  otp: z.string().min(6),
});

export const ZUserRegistration = z
  .object({
    name: z.string().min(1),
    email: z
      .string()
      .email()
      .transform((val) => val.toLowerCase()),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    role: z.enum([Roles.admin, Roles.employee]).default(Roles.employee),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const ZOtpVerify = z.object({
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  otp: z.string().min(4),
});

export const ZLogin = z.object({
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  password: z.string().min(6),
});

export type TUser = z.infer<typeof ZUser>;
export type TUserCompany = z.infer<typeof ZUserCompany>;
export type TCompany = z.infer<typeof ZCompany>;
export type TCompanyDocs = z.infer<typeof ZCompanyDocs>;
export type TQuestionAnswer = z.infer<typeof ZQuestionAnswer>;
export type TOtp = z.infer<typeof ZOtp>;
export type TUserRegistration = z.infer<typeof ZUserRegistration>;
export type TOtpVerify = z.infer<typeof ZOtp>;
export type TLogin = z.infer<typeof ZLogin>;
