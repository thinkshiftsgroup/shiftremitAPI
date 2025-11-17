import { Router } from "express";
import {
  listIndividualKYCController,
  approveIndividualKYCController,
  approveBusinessKYCController,
  rejectIndividualKYCController,
  rejectBusinessKYCController,
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
adminRouter.put(
  "/individual/:kycId/reject",
  asyncHandler(rejectIndividualKYCController)
);

adminRouter.put(
  "/business/:kycId/approve",
  asyncHandler(approveBusinessKYCController)
);
adminRouter.put(
  "/business/:kycId/reject",
  asyncHandler(rejectBusinessKYCController)
);
export const adminKycRouter = adminRouter;
