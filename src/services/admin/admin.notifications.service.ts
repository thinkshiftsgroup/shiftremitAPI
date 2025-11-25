import {
  PrismaClient,
  AdminNotification,
  NotificationType,
} from "@prisma/client";

const prisma = new PrismaClient();

export interface GetNotificationsParams {
  page?: number;
  pageSize?: number;
  usernameFilter?: string;
  countryFilter?: string;
  notificationTypeFilter?: NotificationType;
  isDismissed?: boolean;
}

export class AdminNotificationService {
  public async getNotifications(
    params: GetNotificationsParams = {}
  ): Promise<{ notifications: AdminNotification[]; totalCount: number }> {
    const {
      page = 1,
      pageSize = 20,
      usernameFilter,
      countryFilter,
      notificationTypeFilter,
      isDismissed,
    } = params;

    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      isDismissed: false,
      type: {
        notIn: [NotificationType.TRANSFER, NotificationType.TRANSFER_FAILED],
      },
    };

    if (usernameFilter) {
      whereClause.user = {
        username: {
          contains: usernameFilter,
          mode: "insensitive",
        },
      };
    }

    if (countryFilter) {
      whereClause.user = {
        ...whereClause.user,
        country: {
          contains: countryFilter,
          mode: "insensitive",
        },
      };
    }

    if (notificationTypeFilter) {
      whereClause.type = notificationTypeFilter;
    }

    if (isDismissed !== undefined) {
      whereClause.isDismissed = isDismissed;
    } else {
      whereClause.isDismissed = false;
    }

    const [notifications, totalCount] = await prisma.$transaction([
      prisma.adminNotification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        skip: skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              firstname: true,
              lastname: true,
              country: true,
            },
          },
        },
      }),
      prisma.adminNotification.count({
        where: whereClause,
      }),
    ]);

    return { notifications, totalCount };
  }

  public async markAsRead(id: string): Promise<AdminNotification | null> {
    const notification = await prisma.adminNotification.findUnique({
      where: { id },
      select: { type: true },
    });

    if (!notification) {
      return null;
    }

    const data: { isRead: true; isDismissed?: boolean } = {
      isRead: true,
    };

    if (
      notification.type === NotificationType.TRANSFER ||
      notification.type === NotificationType.BUSINESS_PROFILE_UPDATED ||
      notification.type === NotificationType.USER_PROFILE_UPDATED ||
      notification.type === NotificationType.TRANSFER_FAILED
    ) {
      data.isDismissed = true;
    }

    return prisma.adminNotification.update({
      where: { id },
      data: data,
    });
  }
  public async getUnreadCount(): Promise<number> {
    return prisma.adminNotification.count({
      where: {
        isRead: false,
        isDismissed: false,
      },
    });
  }

  public async markAsDismissed(id: string): Promise<AdminNotification | null> {
    return prisma.adminNotification.update({
      where: { id },
      data: {
        isDismissed: true,
        isRead: true,
      },
    });
  }
}
