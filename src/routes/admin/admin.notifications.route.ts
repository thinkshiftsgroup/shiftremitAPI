import express from "express";
import {
  getAdminNotifications,
  markNotificationAsRead,
  markNotificationAsDismissed,
  getUnreadNotificationCount,
} from "@controllers/admin/admin.notifications.controller";

import { adminProtect } from "@middlewares/auth.middleware";
import asyncHandler from "@utils/asyncHandler";
const router = express.Router();

router.use(adminProtect);
router.get("/", getAdminNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.put("/:id/read", asyncHandler(markNotificationAsRead));
router.put("/:id/dismiss", asyncHandler(markNotificationAsDismissed));

export const adminNotificationsRouter = router;
