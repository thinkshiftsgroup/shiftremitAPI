import { Router } from "express";
import { requestBankTransfer } from "@controllers/banktransfer.controller";
import asyncHandler from "@utils/asyncHandler";
import { protect } from "@middlewares/auth.middleware";
const router = Router();

router.use(protect);
router.post("/request", asyncHandler(requestBankTransfer));

export const bankTransferRouter = router;
