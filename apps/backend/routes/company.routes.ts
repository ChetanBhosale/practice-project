import express from "express";
import {
  createCompany,
  searchCompanies,
  viewCompanyData,
  switchCompany,
  removeUserFromCompany,
  updateCompany,
  joinCompany,
  getUserCompanies,
} from "../controllers/company.controller";
import { authMiddleware, authorize } from "../middleware/auth-middleware";
import { Roles } from "@repo/common";

const router = express.Router();

router.get(
  "/search",
  [authMiddleware, authorize([Roles.admin, Roles.employee])],
  searchCompanies
);

router.get(
  "/:companyId",
  [authMiddleware, authorize([Roles.admin])],
  viewCompanyData
);

// router.get("/user_companies", [authMiddleware], getUserCompanies);

// router.get("/companies", [authMiddleware], getUserCompanies);

router.post(
  "/create",
  [authMiddleware, authorize([Roles.admin])],
  createCompany
);

router.post(
  "/join",
  [authMiddleware, authorize([Roles.employee])],
  joinCompany
);

router.post(
  "/remove_user",
  [authMiddleware, authorize([Roles.admin])],
  removeUserFromCompany
);

router.post(
  "/switch",
  [authMiddleware, authorize([Roles.admin, Roles.employee])],
  switchCompany
);

router.patch(
  "/:companyId",
  [authMiddleware, authorize([Roles.admin])],
  updateCompany
);

export default router;
