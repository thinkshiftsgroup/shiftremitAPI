import axios from "axios";
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
}

export interface ProcessedMoniepointRates {
  moniepoint: SimplifiedRate;
  nala: SimplifiedRate | null;
  lemfi: SimplifiedRate | null;
  sendApp: SimplifiedRate | null;
}

const MONIEPOINT_URL =
  "https://fx-apis.moniepoint.com/marketing/api/v1/fx-rates?sourceCurrency=GBP&targetCurrency=NGN";

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

export const fetchAggregatedFxRates =
  async (): Promise<ProcessedMoniepointRates | null> => {
    const response = await makeMoniepointRequest();

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
      });
      return map;
    }, new Map<string, SimplifiedRate>());

    const moniepointRate: SimplifiedRate = {
      provider: data.moniepointProvider,
      rate: data.moniepointRate,
      retrievedRelative: data.retrievedRelative,
      rateRetrievalMessage: data.moniepointRateRetrievalMessage,
    };

    return {
      moniepoint: moniepointRate,
      nala: competitorRatesMap.get("Nala") || null,
      lemfi: competitorRatesMap.get("LemFi") || null,
      sendApp: competitorRatesMap.get("Send App") || null,
    };
  };
