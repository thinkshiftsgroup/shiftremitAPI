import { Router } from "express";
import {
  getAccountData,
  updateAccountData,
} from "@controllers/admin/admin.transferaccount.controller";
import asyncHandler from "@utils/asyncHandler";
import { adminProtect } from "@middlewares/auth.middleware";
const router = Router();

router.use(adminProtect);
router.get("/", getAccountData);

router.patch("/", asyncHandler(updateAccountData));

export const adminTransferAccountRouter = router;
