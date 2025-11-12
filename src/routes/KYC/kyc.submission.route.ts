import { Router } from "express";
import {
  submitKYCController,
  getKYCStatusController,
} from "@controllers/KYC/kyc.submission.controller";
import { protect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";

const kycRouter = Router();
kycRouter.use(protect);

kycRouter.post("/submit", asyncHandler(submitKYCController));

kycRouter.get("/status", asyncHandler(getKYCStatusController));

export const individualKYCRouter = kycRouter;
