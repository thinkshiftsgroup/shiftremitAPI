import prisma from "@config/db";
import { Prisma } from "@prisma/client";

type RatesData = Prisma.RatesDataGetPayload<{}>;
type RateHistory = Prisma.RateHistoryGetPayload<{}>;
const DEFAULT_RATES = {
  benchmarkGBP: 8.0,
  rateNGN: 1973.0,
};

export const getOrCreateRates = async (): Promise<RatesData> => {
  let rates = await prisma.ratesData.findFirst();

  if (!rates) {
    rates = await prisma.ratesData.create({
      data: DEFAULT_RATES,
    });
  }

  return rates;
};

export const updateRates = async (data: {
  benchmarkGBP?: number;
  rateNGN?: number;
}): Promise<RatesData> => {
  const existingRates = await getOrCreateRates();

  const updatedRates = await prisma.ratesData.update({
    where: { id: existingRates.id },
    data: data,
  });

  await prisma.rateHistory.create({
    data: {
      benchmarkGBP: updatedRates.benchmarkGBP,
      rateNGN: updatedRates.rateNGN,
    },
  });

  return updatedRates;
};

export const getRateHistory = async (): Promise<RateHistory[]> => {
  const history = await prisma.rateHistory.findMany({
    orderBy: {
      recordedAt: "desc",
    },
  });
  return history;
};
