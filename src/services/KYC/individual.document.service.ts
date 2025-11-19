import { MulterFile } from "src/types/Upload";
import { uploadMultipleToCloudinary } from "@utils/cloudinary";
import { DocStatus, IndividualAccountDoc } from "@prisma/client";
import prisma from "@config/db";

export const docMapping = {
  recentProofOfAddress: "recentProofOfAddressStatus",
  recentSelfieWithID: "recentSelfieWithIDStatus",
  proofOfValidID: "proofOfValidIDStatus",

  proofOfValidIDBackView: "proofOfValidIDBackViewStatus",
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

  const file = files[0];
  const sizeKB = file.size / 1024;

  const docUrl = uploadedUrls[0];
  const statusField = docMapping[docType];
  const sizeField = `${docType}SizeKB` as keyof IndividualAccountDoc;

  let docRecord = await prisma.individualAccountDoc.findUnique({
    where: { userId },
  });

  const updateData: any = {
    [docType]: docUrl,
    [sizeField]: sizeKB,
    [statusField]: "IN_REVIEW",
    overallStatus: "PENDING_REVIEW",
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
        overallStatus: "PENDING_REVIEW",
      },
    });
  }

  return { message: "Document uploaded and status set to IN_REVIEW.", docUrl };
};

export const fetchIndividualDocuments = async (userId: string) => {
  const docRecord = await prisma.individualAccountDoc.findUnique({
    where: { userId },
    select: {
      recentProofOfAddress: true,
      recentProofOfAddressSizeKB: true,
      recentProofOfAddressStatus: true,

      recentSelfieWithID: true,
      recentSelfieWithIDSizeKB: true,
      recentSelfieWithIDStatus: true,

      proofOfValidID: true,
      proofOfValidIDSizeKB: true,
      proofOfValidIDStatus: true,

      proofOfValidIDBackView: true,
      proofOfValidIDBackViewSizeKB: true,
      proofOfValidIDBackViewStatus: true,

      recentBankStatement: true,
      recentBankStatementSizeKB: true,
      recentBankStatementStatus: true,

      additionalDocuments: true,
      additionalDocumentsSizeKB: true,
      additionalDocumentsStatus: true,

      overallStatus: true,
    },
  });

  if (!docRecord) {
    return null;
  }

  return docRecord;
};

export const deleteIndividualDocuments = async (userId: string) => {
  const resetData: any = {
    recentProofOfAddress: null,
    recentSelfieWithID: null,
    proofOfValidID: null,
    proofOfValidIDBackView: null,
    recentBankStatement: null,
    additionalDocuments: null,

    recentProofOfAddressStatus: "PENDING",
    recentSelfieWithIDStatus: "PENDING",
    proofOfValidIDStatus: "PENDING",
    proofOfValidIDBackViewStatus: "PENDING",
    recentBankStatementStatus: "PENDING",
    additionalDocumentsStatus: "PENDING",

    overallStatus: "PENDING_UPLOAD",
  };

  const docRecord = await prisma.individualAccountDoc.findUnique({
    where: { userId },
  });

  if (!docRecord) {
    return { success: false, message: "No document record found to reset." };
  }

  await prisma.individualAccountDoc.update({
    where: { userId },
    data: resetData,
  });

  return {
    success: true,
    message: "All document links and statuses have been reset.",
  };
};

export const deleteSingleDocument = async (
  userId: string,
  docType: DocumentType
) => {
  if (!docMapping.hasOwnProperty(docType)) {
    throw new Error(`Invalid document type: ${docType}`);
  }

  const statusField = docMapping[docType];

  const updateData: any = {
    [docType]: null,
    [statusField]: DocStatus.PENDING,
    overallStatus: "PENDING_UPLOAD",
  };

  const docRecord = await prisma.individualAccountDoc.findUnique({
    where: { userId },
  });

  if (!docRecord) {
    return { success: false, message: "No document record found." };
  }

  await prisma.individualAccountDoc.update({
    where: { userId },
    data: updateData,
  });

  return {
    success: true,
    message: `Document '${docType}' link and status have been reset.`,
  };
};
