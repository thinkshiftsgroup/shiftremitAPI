import prisma from "@config/db";
import { Recipient as PrismaRecipient } from "@prisma/client";

interface RecipientWithRecency extends PrismaRecipient {
  lastTransferDate: Date;
}

export const fetchRecentRecipients = async (
  userId: string,
  limit: number = 10,
  nameFilter?: string
): Promise<RecipientWithRecency[]> => {
  let recipientWhereClause: any = {
    userId: userId,
  };

  if (nameFilter) {
    recipientWhereClause.recipientFullName = {
      $regex: nameFilter,
      $options: "i",
    };
  }

  const recipients = await prisma.recipient.findMany({
    where: recipientWhereClause,
  });

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

  const recentRecipients = recipientsWithRecency
    .sort((a, b) => b.lastTransferDate.getTime() - a.lastTransferDate.getTime())
    .slice(0, limit);

  return recentRecipients;
};

export const createRecipient = async (
  userId: string,
  data: Omit<PrismaRecipient, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<PrismaRecipient> => {
  try {
    const newRecipient = await prisma.recipient.create({
      data: {
        userId: userId,
        recipientBankName: data.recipientBankName,
        recipientAccountNumber: data.recipientAccountNumber,
        recipientFullName: data.recipientFullName,
        recipientEmail: data.recipientEmail,
        recipientMobileNumber: data.recipientMobileNumber,
        isRecipientBusinessAccount: data.isRecipientBusinessAccount,
        sortCode: data.sortCode,
      },
    });
    return newRecipient;
  } catch (error) {
    if ((error as any).code === "P2002") {
      throw new Error(
        "A recipient with this account number and bank name already exists for this user."
      );
    }
    throw error;
  }
};

export const updateRecipient = async (
  recipientId: string,
  userId: string,
  data: Partial<
    Omit<PrismaRecipient, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<PrismaRecipient> => {
  const updatedRecipient = await prisma.recipient.update({
    where: {
      id: recipientId,
      userId: userId,
    },
    data: data,
  });
  return updatedRecipient;
};

export const deleteRecipient = async (
  recipientId: string,
  userId: string
): Promise<PrismaRecipient> => {
  const deletedRecipient = await prisma.recipient.delete({
    where: {
      id: recipientId,
      userId: userId,
    },
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
