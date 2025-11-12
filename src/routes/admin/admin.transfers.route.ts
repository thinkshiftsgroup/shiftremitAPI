import { Router } from "express";
import {
  getAllTransfers,
  patchTransferStatus,
  adminDeleteAllTransfersExceptReference,
  adminDeleteTransfer,
} from "@controllers/admin/admin.transfers.controller";
import { adminProtect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = Router();
router.use(adminProtect);

router.post("/:transferId/status", asyncHandler(patchTransferStatus));

router.get("/history", asyncHandler(getAllTransfers));

router.delete("/:transferId", asyncHandler(adminDeleteTransfer));

router.delete(
  "/except/:reference",
  asyncHandler(adminDeleteAllTransfersExceptReference)
);
export const adminTransferRouter = router;
