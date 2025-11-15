import prisma from "@config/db";
import {
  Prisma,
  Director,
  Shareholder,
  PoliticallyExposedPerson,
  BusinessAccount,
  BusinessAccountDoc,
  DocStatus,
  OverallDocStatus,
} from "@prisma/client";
import { MulterFile } from "src/types/Upload";
import { uploadMultipleToCloudinary } from "@utils/cloudinary";

export type UpdateBusinessAccountData = Omit<
  Prisma.BusinessAccountUpdateInput,
  | "user"
  | "userId"
  | "directors"
  | "shareholders"
  | "peps"
  | "businessAccountDocs"
  | "createdAt"
  | "updatedAt"
>;

export const getOrCreateBusinessAccount = async (
  userId: string
): Promise<
  BusinessAccount & {
    directors: Director[];
    shareholders: Shareholder[];
    peps: PoliticallyExposedPerson[];
    businessAccountDocs: BusinessAccountDoc | null;
  }
> => {
  let businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    include: {
      directors: true,
      shareholders: true,
      peps: true,
      businessAccountDocs: true,
    },
  });

  if (!businessAccount) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, phoneNumber: true, country: true },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    const defaultBusinessName = `${user.fullName}'s Business`;
    const placeholderIncorporationNumber = `INC-${Date.now()}`;

    businessAccount = await prisma.businessAccount.create({
      data: {
        userId,
        businessName: defaultBusinessName,
        incorporationNumber: placeholderIncorporationNumber,
        mobileNumber: user.phoneNumber,
        countryOfResidence: user.country,
        businessAccountDocs: {
          create: {
            overallStatus: OverallDocStatus.PENDING_UPLOAD,
          },
        },
      },
      include: {
        directors: true,
        shareholders: true,
        peps: true,
        businessAccountDocs: true,
      },
    });
  }

  return businessAccount;
};

export const updateBusinessAccountFields = async (
  userId: string,
  data: UpdateBusinessAccountData
): Promise<BusinessAccount> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
  });

  if (!businessAccount) {
    throw new Error(
      "Business account not found. Please ensure it has been created."
    );
  }

  return prisma.businessAccount.update({
    where: { userId },
    data: data as Prisma.BusinessAccountUpdateInput,
  });
};
export type DirectorPayloadData = Omit<
  Prisma.DirectorCreateInput,
  "id" | "businessAccount" | "businessAccountId"
>;

export const updateOrCreateDirector = async (
  userId: string,
  directorId: string | null,
  data: DirectorPayloadData,
  documentFiles?: {
    identificationDocumentProofUrl?: MulterFile[];
    residentialAddressUrlProof?: MulterFile[];
  }
): Promise<Director> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const uploadData: { [key: string]: string | null } = {};

  if (documentFiles?.identificationDocumentProofUrl?.[0]) {
    uploadData.identificationDocumentProofUrl =
      await uploadMultipleToCloudinary(
        documentFiles.identificationDocumentProofUrl,
        "raw"
      ).then((urls) => urls[0]);
  }
  if (documentFiles?.residentialAddressUrlProof?.[0]) {
    uploadData.residentialAddressUrlProof = await uploadMultipleToCloudinary(
      documentFiles.residentialAddressUrlProof,
      "raw"
    ).then((urls) => urls[0]);
  }

  const payload = { ...data, ...uploadData };

  if (directorId) {
    return prisma.director.update({
      where: { id: directorId },
      data: payload,
    });
  } else {
    return prisma.director.create({
      data: {
        ...payload,
        businessAccountId: businessAccount.id,
      },
    });
  }
};

export type ShareholderPayloadData = Omit<
  Prisma.ShareholderCreateInput,
  "id" | "businessAccount" | "businessAccountId"
>;

export const updateOrCreateShareholder = async (
  userId: string,
  shareholderId: string | null,
  data: ShareholderPayloadData,
  documentFiles?: {
    validIdUrl?: MulterFile[];
    proofOfAddressUrl?: MulterFile[];
  }
): Promise<Shareholder> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const uploadData: { [key: string]: string | null } = {};

  if (documentFiles?.validIdUrl?.[0]) {
    uploadData.validIdUrl = await uploadMultipleToCloudinary(
      documentFiles.validIdUrl,
      "raw"
    ).then((urls) => urls[0]);
  }
  if (documentFiles?.proofOfAddressUrl?.[0]) {
    uploadData.proofOfAddressUrl = await uploadMultipleToCloudinary(
      documentFiles.proofOfAddressUrl,
      "raw"
    ).then((urls) => urls[0]);
  }

  const payload = { ...data, ...uploadData };

  if (shareholderId) {
    return prisma.shareholder.update({
      where: { id: shareholderId },
      data: payload,
    });
  } else {
    return prisma.shareholder.create({
      data: {
        ...payload,
        businessAccountId: businessAccount.id,
      },
    });
  }
};
export type PEPPayloadData = Omit<
  Prisma.PoliticallyExposedPersonCreateInput,
  "id" | "businessAccount" | "businessAccountId"
>;

export const updateOrCreatePEP = async (
  userId: string,
  pepId: string | null,
  data: PEPPayloadData
): Promise<PoliticallyExposedPerson> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  if (pepId) {
    return prisma.politicallyExposedPerson.update({
      where: { id: pepId },
      data: data,
    });
  } else {
    return prisma.politicallyExposedPerson.create({
      data: {
        ...data,
        businessAccountId: businessAccount.id,
      },
    });
  }
};
