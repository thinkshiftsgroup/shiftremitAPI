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

export class AdminNotificationHelper {
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

  public async notifyIndividualDocSubmission(
    userId: string
  ): Promise<AdminNotification> {
    return this.createNotification({
      userId,
      type: NotificationType.INDIVIDUAL_DOC_UPDATED,
      message:
        "A user has submitted or updated an Individual document for review.",
      linkToResource: `/admin/users/${userId}/individual-docs`,
    });
  }

  public async notifyBusinessDocSubmission(
    userId: string
  ): Promise<AdminNotification> {
    return this.createNotification({
      userId,
      type: NotificationType.BUSINESS_DOC_UPDATED,
      message:
        "A user has submitted or updated a Business document for review.",
      linkToResource: `/admin/users/${userId}/business-docs`,
    });
  }
}
