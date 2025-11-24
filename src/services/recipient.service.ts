import prisma from "@config/db";
import { Recipient as PrismaRecipient } from "@prisma/client";
import { ActivityLogService } from "./admin/admin.logs.service";
import { ActivityType } from "@prisma/client";

const activityLogService = new ActivityLogService();

interface RecipientWithRecency extends PrismaRecipient {
  lastTransferDate: Date;
}

interface PaginatedRecipients {
  recipients: RecipientWithRecency[];
  totalCount: number;
  totalPages: number;
}

export const fetchRecentRecipients = async (
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  nameFilter?: string
): Promise<PaginatedRecipients> => {
  const skip = (page - 1) * pageSize;
  const limit = pageSize;

  let recipientWhereClause: any = {
    userId: userId,
  };

  if (nameFilter) {
    recipientWhereClause.recipientFullName = {
      contains: nameFilter,
      mode: "insensitive",
    };
  }

  const [totalCount, recipients] = await prisma.$transaction([
    prisma.recipient.count({ where: recipientWhereClause }),
    prisma.recipient.findMany({ where: recipientWhereClause }),
  ]);

  const recipientsWithRecencyPromises = recipients.map(async (recipient) => {
    const latestTransfer = await prisma.bankTransfer.findFirst({
      where: {
        userId: userId,
        recipientAccountNumber: recipient.recipientAccountNumber,
        recipientBankName: recipient.recipientBankName,
      },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const lastTransferDate = latestTransfer
      ? latestTransfer.createdAt
      : recipient.createdAt;

    return {
      ...recipient,
      lastTransferDate: lastTransferDate,
    } as RecipientWithRecency;
  });

  const recipientsWithRecency = await Promise.all(
    recipientsWithRecencyPromises
  );

  const sortedRecipients = recipientsWithRecency.sort(
    (a, b) => b.lastTransferDate.getTime() - a.lastTransferDate.getTime()
  );

  const paginatedRecipients = sortedRecipients.slice(skip, skip + limit);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    recipients: paginatedRecipients,
    totalCount,
    totalPages,
  };
};

export const createRecipient = async (
  userId: string,
  data: Omit<PrismaRecipient, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<PrismaRecipient> => {
  const existingRecipient = await prisma.recipient.findUnique({
    where: {
      userId_recipientAccountNumber_recipientBankName: {
        userId: userId,
        recipientAccountNumber: data.recipientAccountNumber,
        recipientBankName: data.recipientBankName,
      },
    },
    select: { id: true },
  });

  if (existingRecipient) {
    throw new Error(
      "A recipient with this account number and bank name already exists for this user."
    );
  }

  const newRecipient = await prisma.recipient.create({
    data: {
      userId: userId,
      recipientBankName: data.recipientBankName,
      recipientAccountNumber: data.recipientAccountNumber,
      recipientFullName: data.recipientFullName,
      recipientEmail: data.recipientEmail,
      recipientMobileNumber: data.recipientMobileNumber,
      isRecipientBusinessAccount: data.isRecipientBusinessAccount,
      purpose: data.purpose,
      sortCode: data.sortCode,
    },
  });

  await activityLogService.logActivity({
    userId,
    activityType: ActivityType.RECIPIENT_ADDED,
    description: `New recipient added: ${newRecipient.recipientFullName}`,
    resourceType: "Recipient",
    resourceId: newRecipient.id,
    metadata: {
      fullName: newRecipient.recipientFullName,
      bankName: newRecipient.recipientBankName,
    },
  });

  return newRecipient;
};

export const updateRecipient = async (
  recipientId: string,
  userId: string,
  data: Partial<
    Omit<PrismaRecipient, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<PrismaRecipient> => {
  if (data.recipientAccountNumber && data.recipientBankName) {
    const conflictRecipient = await prisma.recipient.findFirst({
      where: {
        userId: userId,
        recipientAccountNumber: data.recipientAccountNumber,
        recipientBankName: data.recipientBankName,
        NOT: {
          id: recipientId,
        },
      },
      select: { id: true },
    });

    if (conflictRecipient) {
      throw new Error(
        "A different recipient already exists with this account number and bank name for this user."
      );
    }
  }
  const updatedRecipient = await prisma.recipient.update({
    where: {
      id: recipientId,
      userId: userId,
    },
    data: data,
  });

  await activityLogService.logActivity({
    userId,
    activityType: ActivityType.RECIPIENT_UPDATED,
    description: `Recipient details updated for ${updatedRecipient.recipientFullName}.`,
    resourceType: "Recipient",
    resourceId: recipientId,
    metadata: { updateFields: Object.keys(data), data },
  });

  return updatedRecipient;
};

export const deleteRecipient = async (
  recipientId: string,
  userId: string
): Promise<PrismaRecipient> => {
  const recipient = await getRecipientById(recipientId, userId);
  if (!recipient) {
    throw new Error("Recipient not found or unauthorized.");
  }
  const deletedRecipient = await prisma.recipient.delete({
    where: {
      id: recipientId,
      userId: userId,
    },
  });

  await activityLogService.logActivity({
    userId,
    activityType: ActivityType.RECIPIENT_UPDATED,
    description: `Recipient deleted: ${recipient.recipientFullName}.`,
    resourceType: "Recipient",
    resourceId: recipientId,
    metadata: { fullName: recipient.recipientFullName },
  });

  return deletedRecipient;
};

export const getRecipientById = async (
  recipientId: string,
  userId: string
): Promise<PrismaRecipient | null> => {
  const recipient = await prisma.recipient.findUnique({
    where: {
      id: recipientId,
      userId: userId,
    },
  });
  return recipient;
};
