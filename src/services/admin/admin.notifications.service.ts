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
      isDismissed = false,
    } = params;

    const skip = (page - 1) * pageSize;

    const whereClause: any = {
      isDismissed: isDismissed,
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
    return prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
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
