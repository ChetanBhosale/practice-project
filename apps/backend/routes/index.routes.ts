import express from "express";
const router = express.Router();
import auth from "./auth.routes";
import company from "./company.routes";
import files from "./files.routes";
router.use("/auth", auth);
router.use("/company", company);
router.use("/files", files);

export default router;
