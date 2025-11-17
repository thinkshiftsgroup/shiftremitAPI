import {
  PrismaClient,
  User,
  IndividualAccountDoc,
  BankTransfer,
  IndividualKYC,
  DocStatus,
  OverallDocStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

export interface DetailedUser extends User {
  individualAccountDoc: IndividualAccountDoc | null;
  kycSubmission: IndividualKYC | null;
  lastTransaction: BankTransfer | null;
}

export interface UserWithDocs extends User {
  individualAccountDoc: IndividualAccountDoc | null;
}

export interface UserQueryOptions {
  page: number;
  limit: number;
  sortByAmount?: "asc" | "desc";
  sortByDate?: "asc" | "desc";
  startDate?: Date;
  endDate?: Date;
  name?: string;
  isVerified?: boolean;
}

export type UserUpdatePayload = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt">
>;

export type DocType =
  | "recentProofOfAddress"
  | "recentSelfieWithID"
  | "proofOfValidID"
  | "proofOfValidIDBackView"
  | "recentBankStatement"
  | "additionalDocuments";

const calculateOverallStatus = (
  doc: IndividualAccountDoc,
  updatedKey: keyof IndividualAccountDoc,
  newStatus: DocStatus
): OverallDocStatus => {
  const statuses = [
    updatedKey === "recentProofOfAddressStatus"
      ? newStatus
      : doc.recentProofOfAddressStatus,
    updatedKey === "recentSelfieWithIDStatus"
      ? newStatus
      : doc.recentSelfieWithIDStatus,
    updatedKey === "proofOfValidIDStatus"
      ? newStatus
      : doc.proofOfValidIDStatus,
    updatedKey === "proofOfValidIDBackViewStatus"
      ? newStatus
      : doc.proofOfValidIDBackViewStatus,
    updatedKey === "recentBankStatementStatus"
      ? newStatus
      : doc.recentBankStatementStatus,
    updatedKey === "additionalDocumentsStatus"
      ? newStatus
      : doc.additionalDocumentsStatus,
  ];

  const requiredDocs = [
    doc.recentProofOfAddress,
    doc.recentSelfieWithID,
    doc.proofOfValidID,
    doc.proofOfValidIDBackView,
    doc.recentBankStatement,
  ];
  const isPendingUpload = requiredDocs.some(
    (url) => url === null || url === undefined
  );

  if (isPendingUpload) {
    return OverallDocStatus.PENDING_UPLOAD;
  }
  if (statuses.includes(DocStatus.REJECTED)) {
    return OverallDocStatus.REJECTED;
  }

  if (
    statuses.includes(DocStatus.PENDING) ||
    statuses.includes(DocStatus.IN_REVIEW)
  ) {
    return OverallDocStatus.PENDING_REVIEW;
  }

  if (statuses.every((status) => status === DocStatus.APPROVED)) {
    return OverallDocStatus.APPROVED;
  }

  return OverallDocStatus.PENDING_REVIEW;
};

export const getAllUsers = async (
  options: UserQueryOptions
): Promise<{ users: DetailedUser[]; totalCount: number }> => {
  const {
    page,
    limit,
    sortByAmount,
    sortByDate,
    startDate,
    endDate,
    name,
    isVerified,
  } = options;
  const skip = (page - 1) * limit;

  let where: any = {};
  let prismaOrderBy: any = {};

  if (sortByDate === "asc") {
    prismaOrderBy = { createdAt: "asc" };
  } else if (sortByDate === "desc") {
    prismaOrderBy = { createdAt: "desc" };
  } else {
    prismaOrderBy = { createdAt: "desc" };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt.lt = nextDay;
    }
  }

  if (name) {
    where.fullName = {
      contains: name,
      mode: "insensitive",
    };
  }

  if (isVerified !== undefined) {
    where.isVerified = isVerified;
  }

  const [usersWithRelations, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: where,
      orderBy: prismaOrderBy,
      include: {
        individualAccountDoc: true,
        kycSubmission: true,
        transfers: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.count({ where: where }),
  ]);

  let detailedUsers: DetailedUser[] = usersWithRelations.map((user) => {
    const lastTransaction =
      user.transfers.length > 0 ? user.transfers[0] : null;

    const { transfers, ...userWithoutTransfers } = user;

    return {
      ...userWithoutTransfers,
      lastTransaction: lastTransaction,
    } as DetailedUser;
  });

  if (sortByAmount) {
    detailedUsers.sort((a, b) => {
      const amountA = a.lastTransaction?.amount || 0;
      const amountB = b.lastTransaction?.amount || 0;

      if (sortByAmount === "asc") {
        return amountA - amountB;
      } else {
        return amountB - amountA;
      }
    });
    detailedUsers = detailedUsers.slice(skip, skip + limit);
  } else {
    detailedUsers = detailedUsers.slice(skip, skip + limit);
  }

  return { users: detailedUsers, totalCount: totalCount };
};

export const getUserWithDocs = async (
  userId: string
): Promise<UserWithDocs | null> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      individualAccountDoc: true,
      businessAccount: {
        include: {
          businessAccountDocs: true,
          kycSubmission: true,
        },
      },
    },
  });

  return user as UserWithDocs | null;
};

export const updateUserDetails = async (
  userId: string,
  data: UserUpdatePayload
): Promise<User> => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: data,
  });
  return updatedUser;
};

export const updateIndividualDocStatus = async (
  userId: string,
  docType: DocType,
  status: DocStatus
): Promise<IndividualAccountDoc> => {
  const docStatusField = `${docType}Status` as keyof IndividualAccountDoc;

  const currentDoc = await prisma.individualAccountDoc.findUnique({
    where: { userId: userId },
  });

  if (!currentDoc) {
    throw new Error(`IndividualAccountDoc not found for user ID: ${userId}`);
  }

  const newOverallStatus = calculateOverallStatus(
    currentDoc,
    docStatusField,
    status
  );

  const updatedDoc = await prisma.individualAccountDoc.update({
    where: { userId: userId },
    data: {
      [docStatusField]: status,
      overallStatus: newOverallStatus,
    },
  });

  return updatedDoc;
};
