import { MulterFile } from "src/types/Upload";
import { uploadMultipleToCloudinary } from "@utils/cloudinary";
import { DocStatus, OverallDocStatus } from "@prisma/client";
import prisma from "@config/db";

export const docMapping = {
  businessRegistrationIncorporationCertificate: "registrationCertificateStatus",
  articleOfAssociation: "articleOfAssociationStatus",
  operatingBusinessUtilityBill: "utilityBillStatus",
  companyStatusReports: "companyStatusReportsStatus",
  additionalDocument: "additionalDocumentStatus",
} as const;

export type DocumentType = keyof typeof docMapping;

export const uploadAndSaveBusinessDocuments = async (
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

  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!businessAccount) {
    throw new Error("Business account not found. Cannot save document.");
  }

  let docRecord = await prisma.businessAccountDoc.findUnique({
    where: { businessAccountId: businessAccount.id },
  });

  const updateData: any = {
    [docType]: docUrl,
    [statusField]: DocStatus.IN_REVIEW,
    overallStatus: "PENDING_REVIEW",
  };

  if (docRecord) {
    docRecord = await prisma.businessAccountDoc.update({
      where: { businessAccountId: businessAccount.id },
      data: updateData,
    });
  } else {
    docRecord = await prisma.businessAccountDoc.create({
      data: {
        businessAccountId: businessAccount.id,
        ...updateData,
        overallStatus: "PENDING_REVIEW",
      },
    });
  }

  return { message: "Document uploaded and status set to IN_REVIEW.", docUrl };
};

export const removeBusinessDocumentByType = async (
  userId: string,
  docType: DocumentType
): Promise<{ message: string }> => {
  if (!docMapping.hasOwnProperty(docType)) {
    throw new Error(`Invalid document type: ${docType}`);
  }

  const statusField = docMapping[docType];

  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!businessAccount) {
    throw new Error("Business account not found. Cannot remove document.");
  }

  const updateData: any = {
    [docType]: null,
    [statusField]: DocStatus.PENDING,
    overallStatus: OverallDocStatus.PENDING_UPLOAD,
  };

  await prisma.businessAccountDoc.update({
    where: { businessAccountId: businessAccount.id },
    data: updateData,
  });

  return {
    message: `Document '${docType}' removed and status reset to PENDING.`,
  };
};
