import prisma from "@config/db";
import {
  IndividualKYC,
  IndividualAccountDoc,
  OverallDocStatus,
  DocStatus,
  BusinessKYC,
  BusinessAccountDoc,
  BusinessAccount,
} from "@prisma/client";

export type IndividualKYCSubmission = Omit<IndividualKYC, "userId"> & {
  user: {
    id: string;
    email: string;
    fullName: string;
    username: string;
    country: string | null;
  };
  documents: IndividualAccountDoc | null;
};

export type BusinessKYCSubmission = Omit<BusinessKYC, "businessAccountId"> & {
  businessAccount: {
    id: string;
    businessName: string;
    incorporationNumber: string;
    user: {
      id: string;
      email: string;
      fullName: string;
    };
  };
  documents: BusinessAccountDoc | null;
};

// --- Business KYC Service Functions ---

export const listBusinessKYCSubmissions = async (): Promise<
  BusinessKYCSubmission[]
> => {
  const submissions = await prisma.businessKYC.findMany({
    select: {
      id: true,
      submissionDate: true,
      status: true,
      businessAccount: {
        select: {
          id: true,
          businessName: true,
          incorporationNumber: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          businessAccountDocs: true,
        },
      },
    },
  });

  return submissions.map((submission) => ({
    id: submission.id,
    submissionDate: submission.submissionDate,
    status: submission.status,
    businessAccount: {
      id: submission.businessAccount.id,
      businessName: submission.businessAccount.businessName,
      incorporationNumber: submission.businessAccount.incorporationNumber,
      user: submission.businessAccount.user,
    },
    documents: submission.businessAccount.businessAccountDocs,
  }));
};

export const approveBusinessKYC = async (
  kycId: string
): Promise<BusinessKYC> => {
  const kycSubmission = await prisma.businessKYC.findUnique({
    where: { id: kycId },
    select: { id: true, businessAccountId: true, status: true },
  });

  if (!kycSubmission) {
    throw new Error(`Business KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.APPROVED) {
    return prisma.businessKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  // const docUpdateData: any = {
  //   registrationCertificateStatus: DocStatus.APPROVED,
  //   articleOfAssociationStatus: DocStatus.APPROVED,
  //   utilityBillStatus: DocStatus.APPROVED,
  //   companyStatusReportsStatus: DocStatus.APPROVED,
  //   additionalDocumentStatus: DocStatus.APPROVED,
  //   overallStatus: OverallDocStatus.APPROVED,
  // };

  // const docRecord = await prisma.businessAccountDoc.findUnique({
  //   where: { businessAccountId: kycSubmission.businessAccountId },
  // });

  // if (docRecord) {
  //   await prisma.businessAccountDoc.update({
  //     where: { id: docRecord.id },
  //     data: docUpdateData,
  //   });
  // }

  const updatedKYC = await prisma.businessKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.APPROVED,
    },
  });

  return updatedKYC;
};

export const rejectBusinessKYC = async (
  kycId: string
): Promise<BusinessKYC> => {
  const kycSubmission = await prisma.businessKYC.findUnique({
    where: { id: kycId },
    select: { id: true, businessAccountId: true, status: true },
  });

  if (!kycSubmission) {
    throw new Error(`Business KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.REJECTED) {
    return prisma.businessKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  // const docUpdateData: any = {
  //   registrationCertificateStatus: DocStatus.REJECTED,
  //   articleOfAssociationStatus: DocStatus.REJECTED,
  //   utilityBillStatus: DocStatus.REJECTED,
  //   companyStatusReportsStatus: DocStatus.REJECTED,
  //   additionalDocumentStatus: DocStatus.REJECTED,
  //   overallStatus: OverallDocStatus.REJECTED,
  // };

  // const docRecord = await prisma.businessAccountDoc.findUnique({
  //   where: { businessAccountId: kycSubmission.businessAccountId },
  // });

  // if (docRecord) {
  //   await prisma.businessAccountDoc.update({
  //     where: { id: docRecord.id },
  //     data: docUpdateData,
  //   });
  // }

  const updatedKYC = await prisma.businessKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.REJECTED,
    },
  });

  return updatedKYC;
};

// --- Individual KYC Service Functions ---

export const listIndividualKYCSubmissions = async (): Promise<
  IndividualKYCSubmission[]
> => {
  const submissions = await prisma.individualKYC.findMany({
    select: {
      id: true,
      submissionDate: true,
      status: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          country: true,
          individualAccountDoc: true,
        },
      },
    },
  });

  return submissions.map((submission) => ({
    id: submission.id,
    submissionDate: submission.submissionDate,
    status: submission.status,
    user: submission.user,
    documents: submission.user.individualAccountDoc,
  }));
};

export const approveIndividualKYC = async (
  kycId: string
): Promise<IndividualKYC> => {
  const kycSubmission = await prisma.individualKYC.findUnique({
    where: { id: kycId },
    select: { id: true, userId: true, status: true },
  });

  if (!kycSubmission) {
    throw new Error(`Individual KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.APPROVED) {
    return prisma.individualKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  // const docUpdateData: any = {
  //   recentProofOfAddressStatus: DocStatus.APPROVED,
  //   recentSelfieWithIDStatus: DocStatus.APPROVED,
  //   proofOfValidIDStatus: DocStatus.APPROVED,
  //   proofOfValidIDBackViewStatus: DocStatus.APPROVED,
  //   recentBankStatementStatus: DocStatus.APPROVED,
  //   additionalDocumentsStatus: DocStatus.APPROVED,
  //   overallStatus: OverallDocStatus.APPROVED,
  // };

  // const docRecord = await prisma.individualAccountDoc.findUnique({
  //   where: { userId: kycSubmission.userId },
  // });

  // if (docRecord) {
  //   await prisma.individualAccountDoc.update({
  //     where: { id: docRecord.id },
  //     data: docUpdateData,
  //   });
  // }

  const updatedKYC = await prisma.individualKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.APPROVED,
    },
  });

  return updatedKYC;
};

export const rejectIndividualKYC = async (
  kycId: string
): Promise<IndividualKYC> => {
  const kycSubmission = await prisma.individualKYC.findUnique({
    where: { id: kycId },
    select: { id: true, userId: true, status: true },
  });

  if (!kycSubmission) {
    throw new Error(`Individual KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.REJECTED) {
    return prisma.individualKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  // const docUpdateData: any = {
  //   recentProofOfAddressStatus: DocStatus.REJECTED,
  //   recentSelfieWithIDStatus: DocStatus.REJECTED,
  //   proofOfValidIDStatus: DocStatus.REJECTED,
  //   proofOfValidIDBackViewStatus: DocStatus.REJECTED,
  //   recentBankStatementStatus: DocStatus.REJECTED,
  //   additionalDocumentsStatus: DocStatus.REJECTED,
  //   overallStatus: OverallDocStatus.REJECTED,
  // };

  // const docRecord = await prisma.individualAccountDoc.findUnique({
  //   where: { userId: kycSubmission.userId },
  // });

  // if (docRecord) {
  //   await prisma.individualAccountDoc.update({
  //     where: { id: docRecord.id },
  //     data: docUpdateData,
  //   });
  // }

  const updatedKYC = await prisma.individualKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.REJECTED,
    },
  });

  return updatedKYC;
};
