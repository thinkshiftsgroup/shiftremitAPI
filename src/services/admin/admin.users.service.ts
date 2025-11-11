import { PrismaClient, User, IndividualAccountDoc } from "@prisma/client";

const prisma = new PrismaClient();

export interface UserWithDocs extends User {
  individualAccountDoc: IndividualAccountDoc | null;
}

export const getAllUsers = async (
  page: number,
  limit: number
): Promise<{ users: User[]; totalCount: number }> => {
  const skip = (page - 1) * limit;

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count(),
  ]);

  return { users, totalCount };
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
