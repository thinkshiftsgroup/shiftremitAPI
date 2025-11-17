import prisma from "@config/db";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const generateTransferReference = (): string => {
  const min = 100000;
  const max = 999999;
  const uniqueNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return `SR${uniqueNum}`;
};

export const getLatestRates = async () => {
  const rate = await prisma.ratesData.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      benchmarkGBP: true,
      rateNGN: true,
    },
  });
  if (!rate) {
    throw new Error(
      "Exchange rate data is unavailable. Cannot proceed with transfer."
    );
  }
  return rate;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
