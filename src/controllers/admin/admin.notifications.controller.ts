import { Request, Response } from "express";
import {
  AdminNotificationService,
  GetNotificationsParams,
} from "@services/admin/admin.notifications.service";
import { NotificationType } from "@prisma/client";
const adminNotificationService = new AdminNotificationService();

export const getUnreadNotificationCount = async (
  req: Request,
  res: Response
) => {
  try {
    const count = await adminNotificationService.getUnreadCount();

    res.status(200).json({
      message: "Unred count fetched successfully",
      count: count,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

export const getAdminNotifications = async (req: Request, res: Response) => {
  try {
    const {
      page,
      pageSize,
      usernameFilter,
      countryFilter,
      notificationTypeFilter,
    } = req.query;

    const typeFilter = notificationTypeFilter as NotificationType | undefined;
    const params: GetNotificationsParams = {
      page: page ? parseInt(page as string, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
      usernameFilter: usernameFilter as string,
      countryFilter: countryFilter as string,
      notificationTypeFilter: typeFilter,
    };

    const { notifications, totalCount } =
      await adminNotificationService.getNotifications(params);

    res.status(200).json({
      message: "Notifications fetched Successfully",
      data: notifications,
      meta: {
        total: totalCount,
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        totalPages: Math.ceil(totalCount / (params.pageSize || 20)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin notifications" });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const notification = await adminNotificationService.markAsRead(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res
      .status(200)
      .json({ message: "Notification marked as read", data: notification });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

export const markNotificationAsDismissed = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  try {
    const notification = await adminNotificationService.markAsDismissed(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as dismissed",
      data: notification,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to mark notification as dismissed" });
  }
};
export const deleteAllAdminNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const count = await adminNotificationService.deleteAllNotifications();

    res.status(200).json({
      message: `Successfully deleted ${count} admin notifications`,
      deletedCount: count,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete all admin notifications" });
  }
};
