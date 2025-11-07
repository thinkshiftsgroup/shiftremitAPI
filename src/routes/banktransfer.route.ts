import { Router } from "express";
import {
  requestBankTransfer,
  getUserTransfers,
} from "@controllers/banktransfer.controller";
import asyncHandler from "@utils/asyncHandler";
import { protect } from "@middlewares/auth.middleware";
const router = Router();

router.use(protect);
router.get("/history", asyncHandler(getUserTransfers));
router.post("/request", asyncHandler(requestBankTransfer));

export const bankTransferRouter = router;
