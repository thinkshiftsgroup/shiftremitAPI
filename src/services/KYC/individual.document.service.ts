import { MulterFile } from "src/types/Upload";
import { uploadMultipleToCloudinary } from "@utils/cloudinary";
import prisma from "@config/db";

export const docMapping = {
  recentProofOfAddress: "recentProofOfAddressStatus",
  recentSelfieWithID: "recentSelfieWithIDStatus",
  proofOfValidID: "proofOfValidIDStatus",
  recentBankStatement: "recentBankStatementStatus",
  additionalDocuments: "additionalDocumentsStatus",
} as const;

export type DocumentType = keyof typeof docMapping;

export const uploadAndSaveDocuments = async (
  userId: string,
  files: MulterFile[],
  docType: DocumentType
): Promise<{ message: string; docUrl: string }> => {
  if (!docMapping.hasOwnProperty(docType)) {
    throw new Error(`Invalid document type: ${docType}`);
  }

  const uploadedUrls = await uploadMultipleToCloudinary(files, "raw");

  if (!uploadedUrls || uploadedUrls.length === 0) {
    throw new Error("Cloudinary upload failed.");
  }

  const docUrl = uploadedUrls[0];
  const statusField = docMapping[docType];

  let docRecord = await prisma.individualAccountDoc.findUnique({
    where: { userId },
  });

  const updateData: any = {
    [docType]: docUrl,
    [statusField]: "PENDING",
  };

  if (docRecord) {
    docRecord = await prisma.individualAccountDoc.update({
      where: { userId },
      data: updateData,
    });
  } else {
    docRecord = await prisma.individualAccountDoc.create({
      data: {
        userId,
        ...updateData,
      },
    });
  }

  return { message: "Document uploaded and status set to PENDING.", docUrl };
};

export const fetchIndividualDocuments = async (userId: string) => {
  const docRecord = await prisma.individualAccountDoc.findUnique({
    where: { userId },
    select: {
      recentProofOfAddress: true,
      recentProofOfAddressStatus: true,
      recentSelfieWithID: true,
      recentSelfieWithIDStatus: true,
      proofOfValidID: true,
      proofOfValidIDStatus: true,
      recentBankStatement: true,
      recentBankStatementStatus: true,
      additionalDocuments: true,
      additionalDocumentsStatus: true,
      overallStatus: true,
    },
  });

  if (!docRecord) {
    return null;
  }

  return docRecord;
};
