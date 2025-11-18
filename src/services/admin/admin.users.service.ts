import {
  PrismaClient,
  User,
  IndividualAccountDoc,
  BankTransfer,
  IndividualKYC,
  DocStatus,
  OverallDocStatus,
  BusinessAccountDoc,
  BusinessAccount,
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

export type BusinessAccountUpdatePayload = Partial<
  Omit<
    BusinessAccount,
    | "id"
    | "userId"
    | "createdAt"
    | "updatedAt"
    | "directors"
    | "shareholders"
    | "peps"
    | "businessAccountDocs"
    | "kycSubmission"
  >
>;

export type DocType =
  | "recentProofOfAddress"
  | "recentSelfieWithID"
  | "proofOfValidID"
  | "proofOfValidIDBackView"
  | "recentBankStatement"
  | "additionalDocuments";

export type BusinessDocType =
  | "businessRegistrationIncorporationCertificate"
  | "articleOfAssociation"
  | "operatingBusinessUtilityBill"
  | "companyStatusReports"
  | "additionalDocument";
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

const calculateBusinessOverallStatus = (
  doc: BusinessAccountDoc,
  updatedKey: keyof BusinessAccountDoc,
  newStatus: DocStatus
): OverallDocStatus => {
  const statuses = [
    updatedKey === "registrationCertificateStatus"
      ? newStatus
      : doc.registrationCertificateStatus,
    updatedKey === "articleOfAssociationStatus"
      ? newStatus
      : doc.articleOfAssociationStatus,
    updatedKey === "utilityBillStatus" ? newStatus : doc.utilityBillStatus,
    updatedKey === "companyStatusReportsStatus"
      ? newStatus
      : doc.companyStatusReportsStatus,
    updatedKey === "additionalDocumentStatus"
      ? newStatus
      : doc.additionalDocumentStatus,
  ];

  const requiredDocs = [
    doc.businessRegistrationIncorporationCertificate,
    doc.articleOfAssociation,
    doc.operatingBusinessUtilityBill,
    doc.companyStatusReports,
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
        businessAccount: {
          select: { id: true },
        },
      },
      skip: skip,
      take: limit,
    }),
    prisma.user.count({ where: where }),
  ]);

  let detailedUsers: DetailedUser[] = usersWithRelations.map((user) => {
    const lastTransaction =
      user.transfers.length > 0 ? user.transfers[0] : null;

    const isBusiness = user.businessAccount !== null;
    const isIndividual = user.individualAccountDoc !== null;
    const { transfers, businessAccount, ...userWithoutRelations } = user;

    return {
      ...userWithoutRelations,
      lastTransaction: lastTransaction,
      isBusiness: isBusiness,
      isIndividual: isIndividual,
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
      kycSubmission: true,
      businessAccount: {
        include: {
          businessAccountDocs: true,
          shareholders: true,
          directors: true,
          peps: true,
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
  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use by another user.");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: data,
  });
  return updatedUser;
};
export const updateBusinessAccountDetails = async (
  businessAccountId: string,
  data: BusinessAccountUpdatePayload
): Promise<BusinessAccount> => {
  const updatedBusinessAccount = await prisma.businessAccount.update({
    where: { id: businessAccountId },
    data: data,
  });
  return updatedBusinessAccount;
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

export const updateBusinessDocStatus = async (
  businessAccountId: string,
  docType: BusinessDocType,
  status: DocStatus
): Promise<BusinessAccountDoc> => {
  let docStatusField: keyof BusinessAccountDoc;
  switch (docType) {
    case "businessRegistrationIncorporationCertificate":
      docStatusField = "registrationCertificateStatus";
      break;
    case "articleOfAssociation":
      docStatusField = "articleOfAssociationStatus";
      break;
    case "operatingBusinessUtilityBill":
      docStatusField = "utilityBillStatus";
      break;
    case "companyStatusReports":
      docStatusField = "companyStatusReportsStatus";
      break;
    case "additionalDocument":
      docStatusField = "additionalDocumentStatus";
      break;
    default:
      throw new Error(`Invalid business docType: ${docType}`);
  }

  const currentDoc = await prisma.businessAccountDoc.findUnique({
    where: { businessAccountId: businessAccountId },
  });

  if (!currentDoc) {
    throw new Error(
      `BusinessAccountDoc not found for business Account ID: ${businessAccountId}`
    );
  }

  const newOverallStatus = calculateBusinessOverallStatus(
    currentDoc,
    docStatusField,
    status
  );

  const updatedDoc = await prisma.businessAccountDoc.update({
    where: { businessAccountId: businessAccountId },
    data: {
      [docStatusField]: status,
      overallStatus: newOverallStatus,
    },
  });

  return updatedDoc;
};

export const toggleUserSoftDelete = async (
  userId: string,
  status: boolean
): Promise<User> => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: status },
  });
  return updatedUser;
};
export const toggleUserVerification = async (
  userId: string,
  status: boolean
): Promise<User> => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isVerified: status },
  });
  return updatedUser;
};
