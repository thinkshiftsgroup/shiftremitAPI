import { Router } from "express";
import {
  getAllTransfers,
  patchTransferStatus,
  adminDeleteAllTransfers,
} from "@controllers/admin/admin.transfers.controller";
import { adminProtect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = Router();
router.use(adminProtect);

router.post("/:transferId/status", asyncHandler(patchTransferStatus));

router.get("/history", asyncHandler(getAllTransfers));

export const adminTransferRouter = router;
