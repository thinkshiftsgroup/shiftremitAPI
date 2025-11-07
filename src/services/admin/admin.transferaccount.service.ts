import prisma from "@config/db";
import { Prisma } from "@prisma/client";

type AccountData = Prisma.AccountDataGetPayload<{}>;

const DEFAULT_ACCOUNT = {
  GBPAccountName: "Prospa Technology Limited",
  GBPAccountNumber: "07797478",
};

export const getOrCreateAccount = async (): Promise<AccountData> => {
  let account = await prisma.accountData.findFirst();

  if (!account) {
    account = await prisma.accountData.create({
      data: DEFAULT_ACCOUNT,
    });
  }

  return account;
};

export const updateAccount = async (data: {
  GBPAccountName?: string;
  GBPAccountNumber?: string;
}): Promise<AccountData> => {
  const existingAccount = await getOrCreateAccount();

  const updatedAccount = await prisma.accountData.update({
    where: { id: existingAccount.id },
    data: data,
  });

  return updatedAccount;
};
