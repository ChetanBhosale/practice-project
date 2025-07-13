import mongoose from "mongoose";
import { Roles } from "@repo/common";

export const user = mongoose.model(
  "user",
  new mongoose.Schema(
    {
      name: String,
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: [Roles.admin, Roles.employee],
        default: Roles.employee,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true }
  )
);

export const userCompany = mongoose.model(
  "user_company",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        index: true,
      },
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
        required: true,
        index: true,
      },
      role: {
        type: String,
        enum: [Roles.admin, Roles.employee],
        default: Roles.employee,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  )
);

export const otp = mongoose.model(
  "otp",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
      },
      retryCount: {
        type: Number,
        default: 0,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      lastSentAt: {
        type: Date,
        default: Date.now,
      },
    },
    { timestamps: true }
  )
);
