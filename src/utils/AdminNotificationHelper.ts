import {
  PrismaClient,
  NotificationType,
  AdminNotification,
} from "@prisma/client";

const prisma = new PrismaClient();

type DocType =
  | "recentProofOfAddress"
  | "recentSelfieWithID"
  | "proofOfValidID"
  | "proofOfValidIDBackView"
  | "recentBankStatement"
  | "additionalDocuments";

type BusinessDocType =
  | "businessRegistrationIncorporationCertificate"
  | "articleOfAssociation"
  | "operatingBusinessUtilityBill"
  | "companyStatusReports"
  | "additionalDocument";

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

export const markAdminNotificationsAsDismissed = async (
  userId: string,
  docType: DocType | BusinessDocType
) => {
  const notificationTypeMap: Record<
    DocType | BusinessDocType,
    NotificationType
  > = {
    recentProofOfAddress: NotificationType.INDIVIDUAL_DOC_UPDATED,
    recentSelfieWithID: NotificationType.INDIVIDUAL_DOC_UPDATED,
    proofOfValidID: NotificationType.INDIVIDUAL_DOC_UPDATED,
    proofOfValidIDBackView: NotificationType.INDIVIDUAL_DOC_UPDATED,
    recentBankStatement: NotificationType.INDIVIDUAL_DOC_UPDATED,
    additionalDocuments: NotificationType.INDIVIDUAL_DOC_UPDATED,
    businessRegistrationIncorporationCertificate:
      NotificationType.BUSINESS_DOC_UPDATED,
    articleOfAssociation: NotificationType.BUSINESS_DOC_UPDATED,
    operatingBusinessUtilityBill: NotificationType.BUSINESS_DOC_UPDATED,
    companyStatusReports: NotificationType.BUSINESS_DOC_UPDATED,
    additionalDocument: NotificationType.BUSINESS_DOC_UPDATED,
  };

  const changedDocsFilter = {
    path: "docType",
    equals: docType,
  };
  const notificationType = notificationTypeMap[docType];

  if (!notificationType) return;

  await prisma.adminNotification.updateMany({
    where: {
      userId: userId,
      type: notificationType,
      isDismissed: false,
      isRead: false,
      changedDocs: {
        array_contains: docType,
      } as any,
    },
    data: {
      isDismissed: true,
      isRead: true,
    },
  });
};
