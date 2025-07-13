import express from "express";
import {
  registration,
  verifyOtp,
  loginUser,
  me,
  logoutUser, // Add this import
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth-middleware";

const router = express.Router();

router.post("/registration", registration);
router.post("/verify", verifyOtp);
router.post("/login", loginUser);
router.get("/me", [authMiddleware], me);
router.post("/logout", [authMiddleware], logoutUser); // Add this line

export default router;
