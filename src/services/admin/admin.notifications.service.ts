import {
  PrismaClient,
  NotificationType,
  AdminNotification,
} from "@prisma/client";

const prisma = new PrismaClient();

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  linkToResource?: string;
}

export class AdminNotificationService {
  public async createNotification(
    data: CreateNotificationInput
  ): Promise<AdminNotification> {
    return prisma.adminNotification.create({
      data: {
        userId: data.userId,
        type: data.type,
        message: data.message,
        linkToResource: data.linkToResource,
      },
    });
  }

  public async getPendingNotifications(
    take: number = 50
  ): Promise<AdminNotification[]> {
    return prisma.adminNotification.findMany({
      where: {
        isDismissed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: take,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  public async markAsRead(id: string): Promise<AdminNotification | null> {
    return prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
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

  public async notifyKycSubmitted(userId: string): Promise<AdminNotification> {
    return this.createNotification({
      userId,
      type: NotificationType.KYC_INDIVIDUAL_SUBMITTED,
      message: "A user has submitted new Individual KYC documents for review.",
      linkToResource: `/admin/users/${userId}/kyc`,
    });
  }
}
