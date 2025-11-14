import { Router } from "express";
import { getAdminDashboardSummaryController } from "@controllers/admin/admin.dashboard.controller";
import { adminProtect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = Router();

router.use(adminProtect);
router.get("/summary", asyncHandler(getAdminDashboardSummaryController));

export const adminDashboardRouter = router;
