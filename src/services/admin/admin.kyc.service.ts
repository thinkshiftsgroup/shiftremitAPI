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
import { sendEmail, generateKYCUserEmailHtml } from "@utils/email";

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
    select: {
      id: true,
      businessAccountId: true,
      status: true,
      businessAccount: {
        select: {
          user: { select: { email: true, fullName: true } },
          businessName: true,
        },
      },
    },
  });

  if (!kycSubmission) {
    throw new Error(`Business KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.APPROVED) {
    return prisma.businessKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  const updatedKYC = await prisma.businessKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.APPROVED,
    },
  });

  const userEmail = kycSubmission.businessAccount.user.email;
  const userName = kycSubmission.businessAccount.user.fullName;
  const htmlBody = generateKYCUserEmailHtml("Business", "APPROVED", userName);

  await sendEmail({
    to: userEmail,
    subject: `KYC Approved: ${kycSubmission.businessAccount.businessName}`,
    htmlBody: htmlBody,
  });

  return updatedKYC;
};

export const rejectBusinessKYC = async (
  kycId: string,
  rejectionReason?: string
): Promise<BusinessKYC> => {
  const kycSubmission = await prisma.businessKYC.findUnique({
    where: { id: kycId },
    select: {
      id: true,
      businessAccountId: true,
      status: true,
      businessAccount: {
        select: {
          user: { select: { email: true, fullName: true } },
          businessName: true,
        },
      },
    },
  });

  if (!kycSubmission) {
    throw new Error(`Business KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.REJECTED) {
    return prisma.businessKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  const updatedKYC = await prisma.businessKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.REJECTED,
    },
  });

  const userEmail = kycSubmission.businessAccount.user.email;
  const userName = kycSubmission.businessAccount.user.fullName;
  const htmlBody = generateKYCUserEmailHtml(
    "Business",
    "REJECTED",
    userName,
    rejectionReason
  );

  await sendEmail({
    to: userEmail,
    subject: `KYC Rejected: Action Required for ${kycSubmission.businessAccount.businessName}`,
    htmlBody: htmlBody,
  });

  return updatedKYC;
};

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
    select: {
      id: true,
      userId: true,
      status: true,
      user: { select: { email: true, fullName: true } },
    },
  });

  if (!kycSubmission) {
    throw new Error(`Individual KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.APPROVED) {
    return prisma.individualKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  const updatedKYC = await prisma.individualKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.APPROVED,
    },
  });

  const userEmail = kycSubmission.user.email;
  const userName = kycSubmission.user.fullName;
  const htmlBody = generateKYCUserEmailHtml("Individual", "APPROVED", userName);

  await sendEmail({
    to: userEmail,
    subject: `KYC Approved: Full Access Granted`,
    htmlBody: htmlBody,
  });

  return updatedKYC;
};

export const rejectIndividualKYC = async (
  kycId: string,
  rejectionReason?: string
): Promise<IndividualKYC> => {
  const kycSubmission = await prisma.individualKYC.findUnique({
    where: { id: kycId },
    select: {
      id: true,
      userId: true,
      status: true,
      user: { select: { email: true, fullName: true } },
    },
  });

  if (!kycSubmission) {
    throw new Error(`Individual KYC submission with ID ${kycId} not found.`);
  }

  if (kycSubmission.status === OverallDocStatus.REJECTED) {
    return prisma.individualKYC.findUniqueOrThrow({ where: { id: kycId } });
  }

  const updatedKYC = await prisma.individualKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.REJECTED,
    },
  });

  const userEmail = kycSubmission.user.email;
  const userName = kycSubmission.user.fullName;
  const htmlBody = generateKYCUserEmailHtml(
    "Individual",
    "REJECTED",
    userName,
    rejectionReason
  );

  await sendEmail({
    to: userEmail,
    subject: `KYC Rejected: Action Required`,
    htmlBody: htmlBody,
  });

  return updatedKYC;
};
