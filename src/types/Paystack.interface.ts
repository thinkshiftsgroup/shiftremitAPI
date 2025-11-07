export interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface IResolveAccountPayload {
  accountNumber: string;
  bankCode: string;
}

export interface IResolveAccountData {
  account_number: string;
  account_name: string;
  bank_id: number;
}
export type IResolveAccountResponse = PaystackResponse<IResolveAccountData>;

export interface IValidateAccountPayload {
  accountNumber: string;
  bankCode: string;
  countryCode: string;
  accountName: string;
  accountType: "personal" | "business";
  documentType:
    | "identityNumber"
    | "passportNumber"
    | "businessRegistrationNumber";
  documentNumber: string;
}

export interface IValidateAccountData {
  id: number;
  verified: boolean;
  verificationMessage: string;
}
export type IValidateAccountResponse = PaystackResponse<IValidateAccountData>;
