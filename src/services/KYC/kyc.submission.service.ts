import prisma from "@config/db";
import { OverallDocStatus } from "@prisma/client";

export const submitIndividualKYC = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstname: true,
      lastname: true,
      fullAddress: true,
      country: true,
      meansOfIdentification: true,
      validIDNumber: true,
      purposeOfShiftremit: true,
      individualAccountDoc: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const docRecord = user.individualAccountDoc;

  if (!docRecord) {
    throw new Error(
      "Document record (IndividualAccountDoc) not initialized for user."
    );
  }

  const {
    firstname,
    lastname,
    fullAddress,
    country,
    meansOfIdentification,
    validIDNumber,
    purposeOfShiftremit,
  } = user;

  const {
    recentProofOfAddress,
    proofOfValidID,
    proofOfValidIDBackView,
    recentSelfieWithID,
    recentBankStatement,
  } = docRecord;

  const missingFields: string[] = [];

  if (!firstname || !lastname) missingFields.push("First/Last Name");
  if (!fullAddress) missingFields.push("Full Address");
  if (!country) missingFields.push("Country");
  if (!meansOfIdentification) missingFields.push("Means of Identification");
  if (!validIDNumber) missingFields.push("Valid ID Number");
  if (!purposeOfShiftremit) missingFields.push("Purpose of Shift Remit");

  if (!proofOfValidID) missingFields.push("ID (Front)");
  if (!proofOfValidIDBackView) missingFields.push("ID (Back)");
  if (!recentProofOfAddress) missingFields.push("Proof of Address");
  if (!recentSelfieWithID) missingFields.push("Selfie with ID");
  if (!recentBankStatement) missingFields.push("Bank Statement");

  if (missingFields.length > 0) {
    throw new Error(
      `KYC submission failed. Missing required information/documents: ${missingFields.join(
        ", "
      )}`
    );
  }

  const updateData = {
    submissionDate: new Date(),
    status: OverallDocStatus.PENDING_REVIEW,
  };

  const submittedKYC = await prisma.individualKYC.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData,
    },
    select: {
      status: true,
      submissionDate: true,
    },
  });

  return submittedKYC;
};

export const fetchIndividualKYCStatus = async (userId: string) => {
  const kycRecord = await prisma.individualKYC.findUnique({
    where: { userId },
    select: {
      status: true,
      submissionDate: true,
    },
  });

  if (!kycRecord) {
    return {
      status: OverallDocStatus.NOT_STARTED,
      submissionDate: null,
    };
  }

  return kycRecord;
};
