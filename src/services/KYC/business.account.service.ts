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
  EntityType,
  NotificationType,
} from "@prisma/client";
import { AdminNotificationHelper } from "@utils/AdminNotificationHelper";
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
const notificationHelper = new AdminNotificationHelper();

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

  const updatedAccount = await prisma.businessAccount.update({
    where: { userId },
    data: data as Prisma.BusinessAccountUpdateInput,
  });

  await notificationHelper.createNotification({
    userId,
    type: NotificationType.BUSINESS_PROFILE_UPDATED,
    message: "Updated Business Account profile fields.",
    linkToResource: `/admin/customers/${userId}`,
  });

  return updatedAccount;
};

export type DirectorPayloadData = Omit<
  Prisma.DirectorCreateInput,
  "businessAccount"
> & { id?: string };

export const upsertMultipleDirectors = async (
  userId: string,
  directorsData: DirectorPayloadData[]
): Promise<Director[]> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const upsertPromises = directorsData.map((data) => {
    const { id, ...payload } = data;
    const createPayload = {
      ...payload,
      businessAccountId: businessAccount.id,
      firstname: payload.firstname || "N/A",
      lastname: payload.lastname || "N/A",
    };

    if (id) {
      return prisma.director.update({
        where: { id },
        data: payload,
      });
    } else {
      return prisma.director.create({
        data: createPayload,
      });
    }
  });

  return Promise.all(upsertPromises);
};

export type ShareholderPayloadData = Omit<
  Prisma.ShareholderCreateInput,
  "businessAccount"
> & { id?: string };

export const upsertMultipleShareholders = async (
  userId: string,
  shareholdersData: ShareholderPayloadData[]
): Promise<Shareholder[]> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const upsertPromises = shareholdersData.map((data) => {
    const { id, ...payload } = data;
    const createPayload = {
      ...payload,
      businessAccountId: businessAccount.id,
      percentageSharesOwned: payload.percentageSharesOwned || 0,
      entityType: payload.entityType || EntityType.NATURAL_PERSON,
    };

    if (id) {
      return prisma.shareholder.update({
        where: { id },
        data: payload,
      });
    } else {
      return prisma.shareholder.create({
        data: createPayload,
      });
    }
  });

  return Promise.all(upsertPromises);
};

export type PEPPayloadData = Omit<
  Prisma.PoliticallyExposedPersonCreateInput,
  "businessAccount"
> & { id?: string };

export const upsertMultiplePEPs = async (
  userId: string,
  pepsData: PEPPayloadData[]
): Promise<PoliticallyExposedPerson[]> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const upsertPromises = pepsData.map((data) => {
    const { id, ...payload } = data;
    const createPayload = {
      ...payload,
      businessAccountId: businessAccount.id,
      name: payload.name || "N/A",
    };

    if (id) {
      return prisma.politicallyExposedPerson.update({
        where: { id },
        data: payload,
      });
    } else {
      return prisma.politicallyExposedPerson.create({
        data: createPayload,
      });
    }
  });

  return Promise.all(upsertPromises);
};

//delete records
export const deleteDirectorById = async (
  userId: string,
  directorId: string
): Promise<Director> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const director = await prisma.director.findUnique({
    where: { id: directorId },
  });

  if (!director || director.businessAccountId !== businessAccount.id) {
    throw new Error(
      "Director not found or does not belong to this business account."
    );
  }

  return prisma.director.delete({
    where: { id: directorId },
  });
};

export const deleteShareholderById = async (
  userId: string,
  shareholderId: string
): Promise<Shareholder> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const shareholder = await prisma.shareholder.findUnique({
    where: { id: shareholderId },
  });

  if (!shareholder || shareholder.businessAccountId !== businessAccount.id) {
    throw new Error(
      "Shareholder not found or does not belong to this business account."
    );
  }

  return prisma.shareholder.delete({
    where: { id: shareholderId },
  });
};

export const deletePEPById = async (
  userId: string,
  pepId: string
): Promise<PoliticallyExposedPerson> => {
  const businessAccount = await prisma.businessAccount.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!businessAccount) {
    throw new Error("Business account not found.");
  }

  const pep = await prisma.politicallyExposedPerson.findUnique({
    where: { id: pepId },
  });

  if (!pep || pep.businessAccountId !== businessAccount.id) {
    throw new Error(
      "PEP not found or does not belong to this business account."
    );
  }

  return prisma.politicallyExposedPerson.delete({
    where: { id: pepId },
  });
};
