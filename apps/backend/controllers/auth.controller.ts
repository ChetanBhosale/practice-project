import type { NextFunction, Request, Response } from "express";
import { AuthenticationError, CustomError } from "../middleware/customeError";
import { ZUserRegistration, ZOtpVerify, ZLogin } from "@repo/common/types";
import { user, otp as OtpModel } from "@repo/db/schema/user.schema";
import { generateOtp } from "../utils/generateOtp";
import { sendOtpEmail } from "../utils/sendEmail";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secrets } from "@repo/common/secrets";
import { send } from "../utils/send";
import mongoose from "mongoose";

const MAX_RETRIES = 3;
const BLOCK_DURATION_MINUTES = 15;

export const registration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = ZUserRegistration.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return next(new CustomError(`Validation error: ${errorMsg}`, 400));
    }

    const { name, role, email, password } = parsed.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await user.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name,
          email,
          password: hashedPassword,
          role,
          isVerified: false,
        },
      },
      { upsert: true, new: true }
    );

    if (newUser.isVerified) {
      return next(
        new CustomError(
          "User email already exists, please use another email",
          400
        )
      );
    }

    const existingOtp = await OtpModel.findOne({ userId: newUser._id }).sort({
      createdAt: -1,
    });

    if (existingOtp) {
      const now = new Date();
      const lastSent = existingOtp.lastSentAt || existingOtp.createdAt;
      const diffMs = now.getTime() - lastSent.getTime();
      const diffMins = diffMs / (60 * 1000);

      if (
        existingOtp.retryCount >= MAX_RETRIES &&
        diffMins < BLOCK_DURATION_MINUTES
      ) {
        const wait = Math.ceil(BLOCK_DURATION_MINUTES - diffMins);
        return next(
          new CustomError(
            `Too many OTP attempts. Please try again after ${wait} minutes.`,
            429
          )
        );
      }
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpModel.findOneAndUpdate(
      { userId: newUser._id },
      {
        code,
        expiresAt,
        $inc: { retryCount: 1 },
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, code);

    return send(res, "User registered. OTP sent to email.", 201, {
      success: true,
    });
  } catch (error: any) {
    return next(
      new CustomError(
        error.message || "Something went wrong, please try again later!",
        500
      )
    );
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = ZOtpVerify.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return next(new CustomError(`Validation error: ${errorMsg}`, 400));
    }

    const { email, otp } = parsed.data;

    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return next(new CustomError("User not found", 404));
    }

    if (existingUser.isVerified) {
      return next(new CustomError("User is already verified", 400));
    }

    const otpRecord = await OtpModel.findOne({ userId: existingUser._id }).sort(
      { createdAt: -1 }
    );

    if (!otpRecord) {
      return next(new CustomError("No OTP found. Please request again.", 404));
    }

    const now = new Date();
    const lastSent = otpRecord.lastSentAt || otpRecord.createdAt;
    const diffMs = now.getTime() - lastSent.getTime();
    const diffMins = diffMs / (60 * 1000);

    if (
      otpRecord.retryCount >= MAX_RETRIES &&
      diffMins < BLOCK_DURATION_MINUTES
    ) {
      const wait = Math.ceil(BLOCK_DURATION_MINUTES - diffMins);
      return next(
        new CustomError(
          `Too many failed attempts. Try again after ${wait} minute(s).`,
          429
        )
      );
    }

    if (otpRecord.expiresAt < now) {
      return next(
        new CustomError("OTP has expired. Please request a new one.", 400)
      );
    }

    if (otpRecord.code !== otp) {
      const shouldReset = diffMins >= BLOCK_DURATION_MINUTES;

      await OtpModel.findByIdAndUpdate(otpRecord._id, {
        retryCount: shouldReset ? 1 : otpRecord.retryCount + 1,
        lastSentAt: now,
      });

      return next(new CustomError("Invalid OTP. Please try again.", 400));
    }

    await user.findByIdAndUpdate(existingUser._id, { isVerified: true });
    await OtpModel.deleteOne({ _id: otpRecord._id });

    return send(
      res,
      "OTP verified successfully. User is now verified, please login",
      200,
      { success: true }
    );
  } catch (error: any) {
    return next(
      new CustomError(
        error.message || "Something went wrong, please try again later!",
        500
      )
    );
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = ZLogin.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return next(new CustomError(`Validation error: ${errorMsg}`, 400));
    }

    const { email, password } = parsed.data;

    const userDoc = await user.findOne(
      { email },
      { password: 1, isVerified: 1 }
    );
    if (!userDoc || !(await bcrypt.compare(password, userDoc.password))) {
      return next(new AuthenticationError());
    }

    if (!userDoc.isVerified) {
      return next(new CustomError("Please verify your account first", 403));
    }

    const data = await user.aggregate([
      { $match: { _id: userDoc._id } },
      {
        $lookup: {
          from: "user_companies",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "companies",
                localField: "companyId",
                foreignField: "_id",
                as: "company",
              },
            },
            { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                role: 1,
                companyId: 1,
                company: 1,
              },
            },
          ],
          as: "activeCompanyLink",
        },
      },
      {
        $unwind: {
          path: "$activeCompanyLink",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          activeCompanyLink: 1,
        },
      },
    ]);

    let finalUser = data[0];

    if (!finalUser) {
      return next(new CustomError("User not found", 404));
    }

    // Get company info if exists, otherwise use null
    const companyInfo = finalUser.activeCompanyLink || null;
    const companyId = companyInfo?.companyId || null;
    const role = companyInfo?.role || finalUser.role || "EMPLOYEE"; // Fallback to user's role or default
    const company = companyInfo?.company || null;

    if (!secrets.JWT_SECRET) {
      return next(new CustomError("Server configuration error", 500));
    }

    finalUser.password = undefined;

    const jwtToken = jwt.sign(
      {
        user: finalUser,
      },
      secrets.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt_token", jwtToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return send(res, "Login successful", 200, {
      user: {
        _id: finalUser._id,
        name: finalUser.name,
        email: finalUser.email,
        role: role, // Use the determined role
        isVerified: finalUser.isVerified,
        createdAt: finalUser.createdAt,
        updatedAt: finalUser.updatedAt,
      },
      activeCompany: company, // Will be null if no company
      token: jwtToken,
    });
  } catch (error: any) {
    return next(
      new CustomError(
        error.message || "Something went wrong, please try again later!",
        500
      )
    );
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return next(new AuthenticationError());
    }

    let objectId: any = "";

    if (mongoose.Types.ObjectId.isValid(userId)) {
      objectId = new mongoose.Types.ObjectId(userId);
      console.log("Converted ObjectId:", objectId);
    } else {
      return next(new AuthenticationError());
    }

    const data = await user.aggregate([
      { $match: { _id: objectId } },
      {
        $lookup: {
          from: "user_companies",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "companies",
                localField: "companyId",
                foreignField: "_id",
                as: "company",
              },
            },
            { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                role: 1,
                companyId: 1,
                company: 1,
              },
            },
          ],
          as: "activeCompanyLink",
        },
      },
      {
        $unwind: {
          path: "$activeCompanyLink",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          activeCompanyLink: 1,
        },
      },
    ]);

    const finalUser = data[0];

    if (!finalUser) {
      return next(new CustomError("User not found", 404));
    }

    return send(res, "User fetched successfully", 200, {
      user: {
        _id: finalUser._id,
        name: finalUser.name,
        email: finalUser.email,
        role: finalUser.role,
        isVerified: finalUser.isVerified,
        createdAt: finalUser.createdAt,
        updatedAt: finalUser.updatedAt,
      },
      activeCompany: finalUser.activeCompanyLink?.company || null,
    });
  } catch (error: any) {
    return next(
      new CustomError(
        error.message || "Something went wrong, please try again later!",
        500
      )
    );
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("jwt_token", {
      httpOnly: true,
      sameSite: "strict",
    });

    return send(res, "Logout successful", 200, { success: true });
  } catch (error: any) {
    return next(
      new CustomError(
        error.message || "Something went wrong during logout",
        500
      )
    );
  }
};
