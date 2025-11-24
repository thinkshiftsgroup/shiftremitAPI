import prisma from "@config/db";
import { OverallDocStatus, NotificationType } from "@prisma/client";
import { AdminNotificationHelper } from "@utils/AdminNotificationHelper";
import { ActivityLogService } from "@services/admin/admin.logs.service";
import { ActivityType } from "@prisma/client";

const notificationHelper = new AdminNotificationHelper();
const activityLogService = new ActivityLogService();

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

  await notificationHelper.createNotification({
    userId: userId,
    type: NotificationType.KYC_INDIVIDUAL_SUBMITTED,
    message: `New Individual KYC submitted by ${user.firstname} ${user.lastname} for review.`,
    linkToResource: `/admin/customers/${userId}`,
  });

  await activityLogService.logActivity({
    userId,
    activityType: ActivityType.KYC_INDIVIDUAL_SUBMITTED,
    description: `Individual KYC submitted for review. Status: PENDING_REVIEW`,
    resourceType: "IndividualKYC",
    resourceId: userId,
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

export const submitBusinessKYC = async (userId: string) => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: {
      id: true,
      businessName: true,
      incorporationNumber: true,
      companyAddress: true,
      countryOfIncorporation: true,
      whatDoesTheBusinessDo: true,
      businessAccountDocs: true,
    },
  });

  if (!businessAccount) {
    throw new Error("Business account not found for user.");
  }

  const docRecord = businessAccount.businessAccountDocs;

  if (!docRecord) {
    throw new Error(
      "Document record (BusinessAccountDoc) not initialized for business."
    );
  }

  const {
    businessName,
    incorporationNumber,
    companyAddress,
    countryOfIncorporation,
    whatDoesTheBusinessDo,
  } = businessAccount;

  const {
    businessRegistrationIncorporationCertificate,
    articleOfAssociation,
    operatingBusinessUtilityBill,
    companyStatusReports,
  } = docRecord;

  const missingFields: string[] = [];

  if (!businessName) missingFields.push("Business Name");
  if (!incorporationNumber) missingFields.push("Incorporation Number");
  if (!companyAddress) missingFields.push("Company Address");
  if (!countryOfIncorporation) missingFields.push("Country of Incorporation");
  if (!whatDoesTheBusinessDo) missingFields.push("Business Description");

  if (!businessRegistrationIncorporationCertificate)
    missingFields.push("Registration Certificate");
  if (!articleOfAssociation) missingFields.push("Articles of Association");
  if (!operatingBusinessUtilityBill) missingFields.push("Utility Bill");
  if (!companyStatusReports) missingFields.push("Company Status Reports");

  if (missingFields.length > 0) {
    throw new Error(
      `Business KYC submission failed. Missing required information/documents: ${missingFields.join(
        ", "
      )}`
    );
  }

  const updateData = {
    submissionDate: new Date(),
    status: OverallDocStatus.PENDING_REVIEW,
  };

  const submittedKYC = await prisma.businessKYC.upsert({
    where: { businessAccountId: businessAccount.id },
    update: updateData,
    create: {
      businessAccountId: businessAccount.id,
      ...updateData,
    },
    select: {
      status: true,
      submissionDate: true,
    },
  });

  await notificationHelper.createNotification({
    userId: userId,
    type: NotificationType.KYC_BUSINESS_SUBMITTED,
    message: `New Business KYC submitted for '${businessName}' for review.`,
    linkToResource: `/admin/customers/${userId}`,
  });

  await activityLogService.logActivity({
    userId,
    activityType: ActivityType.KYC_BUSINESS_SUBMITTED,
    description: `Business KYC submitted for '${businessName}' for review. Status: PENDING_REVIEW`,
    resourceType: "BusinessKYC",
    resourceId: businessAccount.id,
    metadata: { businessName },
  });

  return submittedKYC;
};

export const fetchBusinessKYCStatus = async (userId: string) => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true, kycSubmission: true },
  });

  if (!businessAccount) {
    throw new Error("Business account not found for user.");
  }

  const kycRecord = businessAccount.kycSubmission;

  if (!kycRecord) {
    return {
      status: OverallDocStatus.NOT_STARTED,
      submissionDate: null,
    };
  }

  return kycRecord;
};
