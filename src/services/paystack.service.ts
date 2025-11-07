import * as https from "https";

import {
  IResolveAccountPayload,
  IResolveAccountResponse,
  IValidateAccountPayload,
  IValidateAccountResponse,
  PaystackResponse,
} from "src/types/Paystack.interface";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_HOST = "api.paystack.co";

if (!PAYSTACK_SECRET_KEY) {
  throw new Error("Paystack Secret Key not configured.");
}

const paystackRequest = <T>(
  method: "GET" | "POST",
  path: string,
  body: object | null = null
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: PAYSTACK_BASE_HOST,
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.status) {
            resolve(response as T);
          } else {
            reject(
              new Error(response.message || "Paystack API operation failed.")
            );
          }
        } catch (e) {
          reject(
            new Error(
              `Failed to parse Paystack response. Error: ${
                e instanceof Error ? e.message : "Unknown error"
              }`
            )
          );
        }
      });
    });

    req.on("error", (e) =>
      reject(new Error(`API Request Error: ${e.message}`))
    );

    if (body && method === "POST") {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

export interface IBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  currency: string;
}

export type IListBanksResponse = PaystackResponse<IBank[]>;

export class PaystackService {
  public async listBanks(
    country: string,
    use_cursor = false
  ): Promise<IListBanksResponse> {
    const path = `/bank?country=${country}&use_cursor=${use_cursor}`;
    return paystackRequest<IListBanksResponse>("GET", path);
  }

  public async resolveAccount(
    payload: IResolveAccountPayload
  ): Promise<IResolveAccountResponse> {
    const { accountNumber, bankCode } = payload;
    const path = `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
    return paystackRequest<IResolveAccountResponse>("GET", path);
  }

  public async validateAccount(
    payload: IValidateAccountPayload
  ): Promise<IValidateAccountResponse> {
    const body = {
      bank_code: payload.bankCode,
      country_code: payload.countryCode,
      account_number: payload.accountNumber,
      account_name: payload.accountName,
      account_type: payload.accountType,
      document_type: payload.documentType,
      document_number: payload.documentNumber,
    };

    const path = `/bank/validate`;
    return paystackRequest<IValidateAccountResponse>("POST", path, body);
  }
}
