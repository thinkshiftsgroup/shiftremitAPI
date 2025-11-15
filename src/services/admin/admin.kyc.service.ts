import prisma from "@config/db";
import {
  IndividualKYC,
  IndividualAccountDoc,
  OverallDocStatus,
  DocStatus,
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

  const docUpdateData: any = {
    recentProofOfAddressStatus: DocStatus.APPROVED,
    recentSelfieWithIDStatus: DocStatus.APPROVED,
    proofOfValidIDStatus: DocStatus.APPROVED,
    proofOfValidIDBackViewStatus: DocStatus.APPROVED,
    recentBankStatementStatus: DocStatus.APPROVED,
    additionalDocumentsStatus: DocStatus.APPROVED,
    overallStatus: OverallDocStatus.APPROVED,
  };

  const docRecord = await prisma.individualAccountDoc.findUnique({
    where: { userId: kycSubmission.userId },
  });

  if (docRecord) {
    await prisma.individualAccountDoc.update({
      where: { id: docRecord.id },
      data: docUpdateData,
    });
  }

  const updatedKYC = await prisma.individualKYC.update({
    where: { id: kycId },
    data: {
      status: OverallDocStatus.APPROVED,
    },
  });

  return updatedKYC;
};
