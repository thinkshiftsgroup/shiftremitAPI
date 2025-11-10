import { Router } from "express";
import {
  getProfileController,
  updateProfileController,
  updateProfilePhotoController,
} from "../controllers/user.controller";
import asyncHandler from "../utils/asyncHandler";
import { protect } from "@middlewares/auth.middleware";

const router = Router();

router.use(protect);

router.get("/", asyncHandler(getProfileController));
router.patch("/", asyncHandler(updateProfileController));
router.patch("/photo", asyncHandler(updateProfilePhotoController));

export const profileRouter = router;
