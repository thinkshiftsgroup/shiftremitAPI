import prisma from "@config/db";
import { Prisma } from "@prisma/client";

type RatesData = Prisma.RatesDataGetPayload<{}>;

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

  return updatedRates;
};
