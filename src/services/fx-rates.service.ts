import axios from "axios";
import { AxiosResponse } from "axios";

interface LemfiRateBody {
  from: string;
  sender_currency: string;
  to: string;
}

interface LemfiRateData {
  ID: string;
  exchange_from: string;
  exchange_to: string;
  rate: string;
  [key: string]: any;
}

interface LemfiRateResponse {
  data: LemfiRateData;
}

interface FlutterwaveDetailsResponse {
  [key: string]: any;
}

interface NalaRate {
  source_currency: string;
  destination_currency: string;
  rate: string;
  provider_name: string;
  created_at: string;
}

interface NalaRatesResponse {
  code: number;
  data: NalaRate[];
  meta: {
    total: number;
  };
}

export interface AggregatedFxRates {
  lemfiRate: LemfiRateResponse | null;
  flutterwaveDetails: FlutterwaveDetailsResponse | null;
  nalaRates: NalaRatesResponse | null;
}

const LEMFI_URL = "https://lemfi.com/api/lemonade/v2/exchange";
const FLUTTERWAVE_BASE_URL =
  "https://sendgateway.myflutterwave.com/api/v1/config/calculatepaymentdetails";
const NALA_URL = "https://partners-api.prod.nala-api.com/v1/fx/rates";

const makeLemfiRequest = async (
  from: string,
  senderCurrency: string,
  to: string
): Promise<LemfiRateResponse | null> => {
  const requestBody: LemfiRateBody = {
    from: from,
    sender_currency: senderCurrency,
    to: to,
  };

  try {
    const response: AxiosResponse<LemfiRateResponse> = await axios.post(
      LEMFI_URL,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `Lemfi API Error: ${error.response.status} - ${error.message}`
      );
    } else {
      console.error(
        "An unexpected error occurred during Lemfi request:",
        error
      );
    }
    return null;
  }
};

const makeFlutterwaveRequest = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  fromCountry: string,
  toCountry: string
): Promise<FlutterwaveDetailsResponse | null> => {
  const url = `${FLUTTERWAVE_BASE_URL}?Amount=${amount}&FromCurrency=${fromCurrency}&ToCurrency=${toCurrency}&FromCountry=${fromCountry}&ToCountry=${toCountry}`;

  try {
    const response: AxiosResponse<FlutterwaveDetailsResponse> = await axios.get(
      url
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `Flutterwave API Error: ${error.response.status} - ${error.message}`
      );
    } else {
      console.error(
        "An unexpected error occurred during Flutterwave request:",
        error
      );
    }
    return null;
  }
};

const makeNalaAllRequest = async (): Promise<NalaRatesResponse | null> => {
  try {
    const response: AxiosResponse<NalaRatesResponse> = await axios.get(
      NALA_URL
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `Nala API Error: ${error.response.status} - ${error.message}`
      );
    } else {
      console.error("An unexpected error occurred during Nala request:", error);
    }
    return null;
  }
};

export const fetchAggregatedFxRates = async (): Promise<AggregatedFxRates> => {
  const lemfiPromise = makeLemfiRequest("NGN", "Nigeria", "GBP");
  const flutterwavePromise = makeFlutterwaveRequest(
    100,
    "GBP",
    "NGN",
    "GB",
    "NG"
  );
  const nalaPromise = makeNalaAllRequest();

  const [lemfiResult, flutterwaveResult, nalaResult] = await Promise.all([
    lemfiPromise,
    flutterwavePromise,
    nalaPromise,
  ]);

  let filteredNalaRates: NalaRatesResponse | null = null;

  if (nalaResult && nalaResult.data) {
    const desiredCurrencies = new Set(["NGN", "GBP"]);

    const filteredData = nalaResult.data.filter(
      (rate) =>
        desiredCurrencies.has(rate.source_currency) ||
        desiredCurrencies.has(rate.destination_currency)
    );

    filteredNalaRates = {
      ...nalaResult,
      data: filteredData,
      meta: {
        ...nalaResult.meta,
        total: filteredData.length,
      },
    };
  }

  return {
    lemfiRate: lemfiResult,
    flutterwaveDetails: flutterwaveResult,
    nalaRates: filteredNalaRates,
  };
};
