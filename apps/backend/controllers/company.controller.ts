import type { Request, Response, NextFunction } from "express";
import { company as CompanyModel } from "@repo/db/schema/company.schema";
import { user, userCompany } from "@repo/db/schema/user.schema";
import { CustomError } from "../middleware/customeError";
import { send } from "../utils/send";
import { ZCompany } from "@repo/common/types";
import { Roles } from "@repo/common";
import jwt from "jsonwebtoken";
import { secrets } from "@repo/common/secrets";

export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.user;
    const parsed = ZCompany.omit({
      _id: true,
      createdAt: true,
      updatedAt: true,
    }).safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return next(new CustomError(`Validation error: ${errorMsg}`, 400));
    }

    const { name, address } = parsed.data;

    const existing = await CompanyModel.findOne({
      name: new RegExp(`^${name}$`, "i"),
    });
    if (existing) {
      return next(new CustomError("Company name already exists", 409));
    }

    const created = await CompanyModel.create({ name, address });

    await userCompany.create({
      userId: user._id,
      companyId: created._id,
      role: Roles.admin,
      isActive: true,
    });

    return send(res, "Company created successfully", 201, { company: created });
  } catch (err: any) {
    return next(new CustomError(err.message || "Error creating company", 500));
  }
};

export const searchCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== "string") {
      return next(new CustomError("Search query 'name' is required", 400));
    }

    const regex = new RegExp(name, "i");
    const companies = await CompanyModel.find({ name: { $regex: regex } });

    return send(res, "Companies fetched successfully", 200, {
      results: companies,
    });
  } catch (err: any) {
    return next(
      new CustomError(err.message || "Error searching companies", 500)
    );
  }
};

export const viewCompanyData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.user;
    const { companyId } = req.params;

    const membership = await userCompany.findOne({
      userId: user._id,
      companyId,
    });

    if (!membership) {
      return next(new CustomError("You are not a member of this company", 403));
    }

    if (membership.role !== Roles.admin) {
      return next(
        new CustomError("Only admins can view full company data", 403)
      );
    }

    const company = await CompanyModel.findById(companyId);
    if (!company) {
      return next(new CustomError("Company not found", 404));
    }

    const members = await userCompany
      .find({ companyId })
      .populate("userId", "name email");

    const users = members.map((entry: any) => ({
      _id: entry.userId._id,
      name: entry.userId.name,
      email: entry.userId.email,
      role: entry.role,
      isActive: entry.isActive,
    }));

    return send(res, "Company data with members fetched", 200, {
      company,
      users,
    });
  } catch (err: any) {
    return next(
      new CustomError(err.message || "Error fetching company data", 500)
    );
  }
};

export const getUserCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("this is not runn");
  try {
    const user: any = req.user;

    const companies = await userCompany.aggregate([
      {
        $match: { userId: user._id },
      },
      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "companyDetails",
        },
      },
      {
        $unwind: "$companyDetails",
      },
      {
        $project: {
          _id: 0,
          companyId: 1,
          role: 1,
          isActive: 1,
          name: "$companyDetails.name",
          address: "$companyDetails.address",
          createdAt: "$companyDetails.createdAt",
        },
      },
    ]);

    return send(res, "User companies fetched successfully", 200, { companies });
  } catch (error: any) {
    console.log({ error });
    return next(
      new CustomError(error.message || "Error fetching user companies", 500)
    );
  }
};

export const switchCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.user;
    const { companyId } = req.body;

    if (!companyId) {
      return next(new CustomError("Company ID is required", 400));
    }

    const membership = await userCompany.findOne({
      userId: user._id,
      companyId,
    });

    if (!membership) {
      return next(new CustomError("You are not a member of this company", 403));
    }

    await userCompany.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    await userCompany.findOneAndUpdate(
      { userId: user._id, companyId },
      { isActive: true },
      { new: true }
    );

    const company = await CompanyModel.findById(companyId);

    if (!secrets.JWT_SECRET) {
      return next(new CustomError("Server configuration error", 500));
    }

    const jwtToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: membership.role,
        companyId,
      },
      secrets.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt_token", jwtToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return send(res, "Switched company successfully", 200, {
      company,
      token: jwtToken,
    });
  } catch (err: any) {
    return next(new CustomError(err.message || "Error switching company", 500));
  }
};

export const joinCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.user;
    const { companyId } = req.body;

    if (!companyId) {
      return next(new CustomError("Company ID is required", 400));
    }

    const company = await CompanyModel.findById(companyId);
    if (!company) {
      return next(new CustomError("Company not found", 404));
    }

    const existingMembership = await userCompany.findOne({
      userId: user._id,
      companyId,
    });

    if (existingMembership) {
      return next(
        new CustomError("You are already a member of this company", 409)
      );
    }

    await userCompany.create({
      userId: user._id,
      companyId,
      role: Roles.employee,
      isActive: true,
    });

    return send(res, "Successfully joined the company", 200, {
      company: {
        _id: company._id,
        name: company.name,
        role: Roles.employee,
      },
    });
  } catch (err: any) {
    return next(new CustomError(err.message || "Error joining company", 500));
  }
};

export const removeUserFromCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.user;
    const { companyId, userId } = req.body;

    if (!companyId || !userId) {
      return next(new CustomError("Company ID and user ID are required", 400));
    }

    const membership = await userCompany.findOne({
      userId: user._id,
      companyId,
    });

    if (!membership || membership.role !== Roles.admin) {
      return next(
        new CustomError("Only admins can remove users from a company", 403)
      );
    }

    if (user._id.toString() === userId) {
      return next(new CustomError("Admins cannot remove themselves", 400));
    }

    const targetMembership = await userCompany.findOne({
      userId,
      companyId,
    });
    if (!targetMembership) {
      return next(new CustomError("User is not a member of this company", 404));
    }

    await userCompany.deleteOne({ userId, companyId });

    return send(res, "User removed from company successfully", 200, {});
  } catch (err: any) {
    return next(
      new CustomError(err.message || "Error removing user from company", 500)
    );
  }
};

export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: any = req.user;
    const { companyId } = req.params;
    const parsed = ZCompany.omit({
      _id: true,
      createdAt: true,
      updatedAt: true,
    })
      .partial()
      .safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return next(new CustomError(`Validation error: ${errorMsg}`, 400));
    }

    const { name, address } = parsed.data;

    const membership = await userCompany.findOne({
      userId: user._id,
      companyId,
    });

    if (!membership || membership.role !== Roles.admin) {
      return next(
        new CustomError("Only admins can update company details", 403)
      );
    }

    const company = await CompanyModel.findById(companyId);
    if (!company) {
      return next(new CustomError("Company not found", 404));
    }

    if (name && name !== company.name) {
      const existing = await CompanyModel.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });
      if (existing) {
        return next(new CustomError("Company name already exists", 409));
      }
    }

    const updated = await CompanyModel.findByIdAndUpdate(
      companyId,
      { $set: { name, address } },
      { new: true }
    );

    return send(res, "Company updated successfully", 200, { company: updated });
  } catch (err: any) {
    return next(new CustomError(err.message || "Error updating company", 500));
  }
};
