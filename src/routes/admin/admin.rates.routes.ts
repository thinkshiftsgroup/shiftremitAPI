import { Router } from "express";
import {
  getCurrentRates,
  updateCurrentRates,
  getRateHistoryController,
} from "@controllers/admin/admin.rates.controller";
import asyncHandler from "@utils/asyncHandler";
import { adminProtect } from "@middlewares/auth.middleware";
const router = Router();

router.get("/", getCurrentRates);
router.get("/history", adminProtect, asyncHandler(getRateHistoryController));
router.put("/", adminProtect, asyncHandler(updateCurrentRates));

export const adminRatesRouter = router;
