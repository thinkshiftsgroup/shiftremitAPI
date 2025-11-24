import axios from "axios";
import prisma from "@config/db";
import { AxiosResponse } from "axios";

interface CompetitorRate {
  provider: string;
  rate: number;
  rateDifference: number;
  retrievedAt: string;
  enabled: boolean;
  retrievedRelative: string;
  rateRetrievalMessage: string;
  logo: string;
  showOnWebApp: boolean;
  showOnMobileApp: boolean;
}

interface MoniepointRateData {
  moniepointProvider: string;
  moniepointRate: number;
  sourceCurrencyCode: string;
  destinationCurrencyCode: string;
  retrievedAt: string;
  retrievedRelative: string;
  rateRetrievalMessage: string;
  moniepointRateRetrievalMessage: string;
  competitorRateRetrievalMessage: string;
  competitorRates: CompetitorRate[];
  moniepointSupported: boolean;
  promotionValue: number;
  baseRate: number;
  promotionExpiresAt: string;
  promotionName: string;
  promotionDescription: string;
  promotionDurationInDays: number;
  promotionNote: string;
  hasPromotion: boolean;
}

interface MoniepointRateResponse {
  code: string;
  description: string;
  responseCode: string;
  responseMessage: string;
  data: MoniepointRateData;
  success: boolean;
}

export interface SimplifiedRate {
  provider: string;
  rate: number;
  retrievedRelative: string;
  rateRetrievalMessage: string;
  imageUrl?: string;
}

export interface ProcessedMoniepointRates {
  nala: SimplifiedRate;
  lemfi: SimplifiedRate;
  sendApp: SimplifiedRate;
  shiftremit: SimplifiedRate;
}

const MONIEPOINT_URL =
  "https://fx-apis.moniepoint.com/marketing/api/v1/fx-rates?sourceCurrency=GBP&targetCurrency=NGN";

const DEFAULT_RATES: { [key: string]: SimplifiedRate } = {
  nala: {
    provider: "Nala",
    rate: 1907,
    retrievedRelative: "updated 1-2 hrs",
    rateRetrievalMessage: "Boosted rate applied",
    imageUrl: "https://shiftremit.com/images/brands/vec-6.svg",
  },
  lemfi: {
    provider: "LemFi",
    rate: 1924,
    retrievedRelative: "updated 1-2 hrs",
    rateRetrievalMessage: "Boosted rate applied",
    imageUrl: "https://shiftremit.com/images/brands/vec-4.svg",
  },
  sendApp: {
    provider: "Send App",
    rate: 1903,
    retrievedRelative: "updated 1-2 hrs",
    rateRetrievalMessage: "Boosted rate applied",
    imageUrl: "https://shiftremit.com/images/brands/vec-6.svg",
  },
  shiftremit: {
    provider: "Shift Remit",
    rate: 0,
    retrievedRelative: "Live calculation",
    rateRetrievalMessage: "Rate calculation pending.",
    imageUrl: "https://shiftremit.com/images/brands/vec-1.svg",
  },
};

const makeMoniepointRequest =
  async (): Promise<MoniepointRateResponse | null> => {
    try {
      const response: AxiosResponse<MoniepointRateResponse> = await axios.get(
        MONIEPOINT_URL
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          `Moniepoint API Error: ${error.response.status} - ${error.message}`
        );
      } else {
        console.error(
          "An unexpected error occurred during Moniepoint request:",
          error
        );
      }
      return null;
    }
  };

const getLatestBenchmarkRate = async (): Promise<number> => {
  const latestRate = await prisma.rateHistory.findFirst({
    orderBy: {
      recordedAt: "desc",
    },
    select: {
      benchmarkGBP: true,
    },
  });

  return latestRate?.benchmarkGBP ?? 0;
};

export const fetchAggregatedFxRates =
  async (): Promise<ProcessedMoniepointRates | null> => {
    const response = await makeMoniepointRequest();
    const benchmarkGBP = await getLatestBenchmarkRate();

    if (!response || !response.success || !response.data) {
      return null;
    }

    const { data } = response;

    const competitorRatesMap = data.competitorRates.reduce((map, rate) => {
      map.set(rate.provider, {
        provider: rate.provider,
        rate: rate.rate,
        retrievedRelative: rate.retrievedRelative,
        rateRetrievalMessage: rate.rateRetrievalMessage,
        imageUrl:
          DEFAULT_RATES[rate.provider.toLowerCase().replace(/\s/g, "")]
            ?.imageUrl,
      });
      return map;
    }, new Map<string, SimplifiedRate>());

    const lemfiRate = competitorRatesMap.get("LemFi") || DEFAULT_RATES.lemfi;
    const shiftRemitRate = lemfiRate.rate + benchmarkGBP;

    return {
      nala: competitorRatesMap.get("Nala") || DEFAULT_RATES.nala,
      lemfi: lemfiRate,
      sendApp: competitorRatesMap.get("Send App") || DEFAULT_RATES.sendApp,
      shiftremit: {
        provider: DEFAULT_RATES.shiftremit.provider,
        rate: shiftRemitRate,
        retrievedRelative: DEFAULT_RATES.shiftremit.retrievedRelative,
        rateRetrievalMessage: `Based on LemFi rate plus ${benchmarkGBP} GBP benchmark.`,
        imageUrl: DEFAULT_RATES.shiftremit.imageUrl,
      },
    };
  };
