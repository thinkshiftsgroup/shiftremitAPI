import { Router } from "express";
import {
  listAllUsers,
  getUserDetails,
  updateUserController,
  updateIndividualDocStatusController,
  updateBusinessDocStatusController,
  updateBusinessAccountController,
} from "@controllers/admin/admin.users.controller";
import asyncHandler from "@utils/asyncHandler";
import { adminProtect } from "@middlewares/auth.middleware";
const router = Router();

router.use(adminProtect);
router.get("/", asyncHandler(listAllUsers));
router.get("/:id", asyncHandler(getUserDetails));

router.patch("/:id", asyncHandler(updateUserController));
router.patch(
  "/:id/document-status",
  asyncHandler(updateIndividualDocStatusController)
);

router.patch(
  "/:businessAccountId/business-document-status",
  asyncHandler(updateBusinessDocStatusController)
);

router.patch(
  "/:businessAccountId/business-account-details",
  asyncHandler(updateBusinessAccountController)
);
export const adminUsersRouter = router;
