import { Router } from "express";
import {
  getProfileController,
  updateProfileController,
  updateProfilePhotoController,
  updateProfilePhotoAppController,
} from "../controllers/user.controller";
import asyncHandler from "../utils/asyncHandler";
import { protect } from "@middlewares/auth.middleware";
import multer from "multer";
const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.use(protect);

router.get("/", asyncHandler(getProfileController));
router.patch("/", asyncHandler(updateProfileController));

router.patch(
  "/photo-url",
  upload.single("profile_photo"),
  asyncHandler(updateProfilePhotoAppController)
);
router.patch("/photo", asyncHandler(updateProfilePhotoController));

export const profileRouter = router;
