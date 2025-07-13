import express from "express";
import { authMiddleware, authorize } from "../middleware/auth-middleware";
import { Roles } from "@repo/common";
import { uploadFileByAdmin } from "../controllers/file.controller";
const router = express.Router();

router.post(
  "/upload-docs",
  [authMiddleware, authorize([Roles.admin])],
  uploadFileByAdmin
);

export default router;
