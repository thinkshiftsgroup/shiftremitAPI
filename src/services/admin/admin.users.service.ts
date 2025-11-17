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

  let where: any = {};
  let prismaOrderBy: any = {};

  if (sortByDate === "asc") {
    prismaOrderBy = { createdAt: "asc" };
  } else if (sortByDate === "desc") {
    prismaOrderBy = { createdAt: "desc" };
  } else {
    prismaOrderBy = { createdAt: "desc" };
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
      contains: name,
      mode: "insensitive",
    };
  }

  if (isVerified !== undefined) {
    where.isVerified = isVerified;
  }

  const [usersWithRelations, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: where,
      orderBy: prismaOrderBy,
      include: {
        individualAccountDoc: true,
        kycSubmission: true,
        transfers: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.count({ where: where }),
  ]);

  let detailedUsers: DetailedUser[] = usersWithRelations.map((user) => {
    const lastTransaction =
      user.transfers.length > 0 ? user.transfers[0] : null;

    const { transfers, ...userWithoutTransfers } = user;

    return {
      ...userWithoutTransfers,
      lastTransaction: lastTransaction,
    } as DetailedUser;
  });

  if (sortByAmount) {
    detailedUsers.sort((a, b) => {
      const amountA = a.lastTransaction?.amount || 0;
      const amountB = b.lastTransaction?.amount || 0;

      if (sortByAmount === "asc") {
        return amountA - amountB;
      } else {
        return amountB - amountA;
      }
    });
    detailedUsers = detailedUsers.slice(skip, skip + limit);
  } else {
    detailedUsers = detailedUsers.slice(skip, skip + limit);
  }

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
      businessAccount: {
        include: {
          businessAccountDocs: true,
          kycSubmission: true,
        },
      },
    },
  });

  return user as UserWithDocs | null;
};
