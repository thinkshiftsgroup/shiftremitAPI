import prisma from "@config/db";
import { TransferStatus } from "@prisma/client";

interface Recipient {
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientFullName: string;
  recipientEmail: string;
  isRecipientBusinessAccount: boolean;
  sortCode: string | null;
  lastTransferDate: Date;
}

export const fetchRecentRecipients = async (
  userId: string,
  limit: number = 10,
  nameFilter?: string
): Promise<Recipient[]> => {
  let whereClause: any = {
    userId: userId,
  };

  if (nameFilter) {
    whereClause.recipientFullName = {
      $regex: nameFilter,
      $options: "i",
    };
  }

  const transfers = await prisma.bankTransfer.findMany({
    where: whereClause,
    select: {
      recipientBankName: true,
      recipientAccountNumber: true,
      recipientFullName: true,
      recipientEmail: true,
      isRecipientBusinessAccount: true,
      sortCode: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const uniqueRecipientsMap = new Map<string, Recipient>();

  for (const transfer of transfers) {
    const key = `${transfer.recipientAccountNumber}-${transfer.recipientBankName}`;

    if (!uniqueRecipientsMap.has(key)) {
      uniqueRecipientsMap.set(key, {
        recipientBankName: transfer.recipientBankName,
        recipientAccountNumber: transfer.recipientAccountNumber,
        recipientFullName: transfer.recipientFullName,
        recipientEmail: transfer.recipientEmail,
        isRecipientBusinessAccount: transfer.isRecipientBusinessAccount,
        sortCode: transfer.sortCode,
        lastTransferDate: transfer.createdAt,
      });
    }
  }

  const recentRecipients = Array.from(uniqueRecipientsMap.values())
    .sort((a, b) => b.lastTransferDate.getTime() - a.lastTransferDate.getTime())
    .slice(0, limit);

  return recentRecipients;
};
