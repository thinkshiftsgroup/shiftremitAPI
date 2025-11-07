import prisma from "@config/db";

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
