import { Router } from "express";
import { PaystackController } from "@controllers/paystack.controller";

import asyncHandler from "../utils/asyncHandler";

const router = Router();
const paystackController = new PaystackController();

router.get("/banks", asyncHandler(paystackController.listBanks));
router.post("/resolve", asyncHandler(paystackController.resolveAccount));
router.post("/validate", asyncHandler(paystackController.validateAccount));

export const verificationRouter = router;
