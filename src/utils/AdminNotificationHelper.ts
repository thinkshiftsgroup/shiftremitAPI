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
  changedFields?: string[];
  changedDocs?: string[];
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
        changedFields: data.changedFields,
        changedDocs: data.changedDocs,
      },
    });
  }

  public async notifyIndividualDocSubmission(
    userId: string,
    changedDocs: string[]
  ): Promise<AdminNotification> {
    return this.createNotification({
      userId,
      type: NotificationType.INDIVIDUAL_DOC_UPDATED,
      message:
        "A user has submitted or updated an Individual document for review.",
      linkToResource: `/admin/customers/${userId}`,
      changedDocs,
    });
  }

  public async notifyBusinessDocSubmission(
    userId: string,
    changedDocs: string[]
  ): Promise<AdminNotification> {
    return this.createNotification({
      userId,
      type: NotificationType.BUSINESS_DOC_UPDATED,
      message:
        "A user has submitted or updated a Business document for review.",
      linkToResource: `/admin/customers/${userId}`,
      changedDocs,
    });
  }
}
