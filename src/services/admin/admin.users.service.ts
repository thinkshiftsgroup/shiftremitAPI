import {
  PrismaClient,
  User,
  IndividualAccountDoc,
  BankTransfer,
  IndividualKYC,
} from "@prisma/client";

const prisma = new PrismaClient();

export interface DetailedUser extends User {
  individualAccountDoc: IndividualAccountDoc | null;
  kycSubmission: IndividualKYC | null;
  lastTransaction: BankTransfer | null;
}

export interface UserWithDocs extends User {
  individualAccountDoc: IndividualAccountDoc | null;
}

export interface UserQueryOptions {
  page: number;
  limit: number;
  sortByAmount?: "asc" | "desc";
  sortByDate?: "asc" | "desc";
  startDate?: Date;
  endDate?: Date;
  name?: string;
  isVerified?: boolean;
}

export const getAllUsers = async (
  options: UserQueryOptions
): Promise<{ users: DetailedUser[]; totalCount: number }> => {
  const {
    page,
    limit,
    sortByAmount,
    sortByDate,
    startDate,
    endDate,
    name,
    isVerified,
  } = options;
  const skip = (page - 1) * limit;

  let orderBy: any = {};
  let where: any = {};

  if (sortByDate === "asc") {
    orderBy = { createdAt: "asc" };
  } else if (sortByDate === "desc") {
    orderBy = { createdAt: "desc" };
  } else {
    orderBy = { createdAt: "desc" };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.createdAt.lt = nextDay;
    }
  }

  if (name) {
    where.fullName = {
      $regex: name,
      $options: "i",
    };
  }

  if (isVerified !== undefined) {
    where.isVerified = isVerified;
  }

  const [usersWithRelations, totalCount] = await Promise.all([
    prisma.user.findMany({
      skip: skip,
      take: limit,
      where: where,
      orderBy: orderBy,
      include: {
        individualAccountDoc: true,
        kycSubmission: true,
        transfers: {
          take: 1,
          orderBy: [
            ...(sortByAmount ? [{ amount: sortByAmount }] : []),
            { createdAt: "desc" },
          ],
        },
      },
    }),
    prisma.user.count({ where: where }),
  ]);

  const detailedUsers: DetailedUser[] = usersWithRelations.map((user) => {
    const lastTransaction =
      user.transfers.length > 0 ? user.transfers[0] : null;

    const { transfers, ...userWithoutTransfers } = user;

    return {
      ...userWithoutTransfers,
      lastTransaction: lastTransaction,
    } as DetailedUser;
  });

  return { users: detailedUsers, totalCount: totalCount };
};

export const getUserWithDocs = async (
  userId: string
): Promise<UserWithDocs | null> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      individualAccountDoc: true,
    },
  });

  return user as UserWithDocs | null;
};
