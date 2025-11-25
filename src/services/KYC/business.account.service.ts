import prisma from "@config/db";
import {
  Prisma,
  Director,
  Shareholder,
  PoliticallyExposedPerson,
  BusinessAccount,
  BusinessAccountDoc,
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

  const changedFields: string[] = [];
  const incomingKeys = Object.keys(data);

  incomingKeys.forEach((key) => {
    const oldVal = businessAccount[key as keyof BusinessAccount];
    const newVal = data[key as keyof UpdateBusinessAccountData];

    if (oldVal !== newVal) {
      changedFields.push(key);
    }
  });

  const updatedAccount = await prisma.businessAccount.update({
    where: { userId },
    data: data as Prisma.BusinessAccountUpdateInput,
  });

  if (changedFields.length > 0) {
    await notificationHelper.createNotification({
      userId,
      type: NotificationType.BUSINESS_PROFILE_UPDATED,
      message: `Updated Business Account profile fields: ${changedFields.join(
        ", "
      )}`,
      linkToResource: `/admin/customers/${userId}`,
      changedFields: changedFields,
    });
  }

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

  const directors = await Promise.all(upsertPromises);

  await notificationHelper.createNotification({
    userId,
    type: NotificationType.BUSINESS_PROFILE_UPDATED,
    message: "Directors list/details were updated.",
    linkToResource: `/admin/customers/${userId}`,
    changedFields: ["directors"],
  });

  return directors;
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

  const shareholders = await Promise.all(upsertPromises);

  // Notify after upsert completion
  await notificationHelper.createNotification({
    userId,
    type: NotificationType.BUSINESS_PROFILE_UPDATED,
    message: "Shareholders list/details were updated.",
    linkToResource: `/admin/customers/${userId}`,
    changedFields: ["shareholders"],
  });

  return shareholders;
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

  const peps = await Promise.all(upsertPromises);

  // Notify after upsert completion
  await notificationHelper.createNotification({
    userId,
    type: NotificationType.BUSINESS_PROFILE_UPDATED,
    message: "Politically Exposed Persons (PEPs) list/details were updated.",
    linkToResource: `/admin/customers/${userId}`,
    changedFields: ["peps"],
  });

  return peps;
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

  const deletedDirector = await prisma.director.delete({
    where: { id: directorId },
  });

  // Notify after deletion
  await notificationHelper.createNotification({
    userId,
    type: NotificationType.BUSINESS_PROFILE_UPDATED,
    message: "A Director record was deleted.",
    linkToResource: `/admin/customers/${userId}`,
    changedFields: ["directors"],
  });

  return deletedDirector;
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

  const deletedShareholder = await prisma.shareholder.delete({
    where: { id: shareholderId },
  });

  // Notify after deletion
  await notificationHelper.createNotification({
    userId,
    type: NotificationType.BUSINESS_PROFILE_UPDATED,
    message: "A Shareholder record was deleted.",
    linkToResource: `/admin/customers/${userId}`,
    changedFields: ["shareholders"],
  });

  return deletedShareholder;
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

  const deletedPEP = await prisma.politicallyExposedPerson.delete({
    where: { id: pepId },
  });

  await notificationHelper.createNotification({
    userId,
    type: NotificationType.BUSINESS_PROFILE_UPDATED,
    message: "A PEP record was deleted.",
    linkToResource: `/admin/customers/${userId}`,
    changedFields: ["peps"],
  });

  return deletedPEP;
};
