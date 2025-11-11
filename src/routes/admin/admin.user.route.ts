import { Router } from "express";
import {
  listAllUsers,
  getUserDetails,
} from "@controllers/admin/admin.users.controller";
import asyncHandler from "@utils/asyncHandler";
import { adminProtect } from "@middlewares/auth.middleware";
const router = Router();

router.use(adminProtect);
router.get("/", asyncHandler(listAllUsers));
router.get("/:id", asyncHandler(getUserDetails));

export const adminUsersRouter = router;
