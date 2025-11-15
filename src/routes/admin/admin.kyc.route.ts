import { Router } from "express";
import {
  listIndividualKYCController,
  approveIndividualKYCController,
} from "@controllers/admin/admin.kyc.controller";
import { adminProtect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const adminRouter = Router();

adminRouter.use(adminProtect);

adminRouter.get("/individual", asyncHandler(listIndividualKYCController));

adminRouter.put(
  "/individual/:kycId/approve",
  asyncHandler(approveIndividualKYCController)
);

export const adminKycRouter = adminRouter;
