import { Request, Response } from "express";
import { PaystackService } from "@services/paystack.service";
import {
  IResolveAccountPayload,
  IValidateAccountPayload,
} from "src/types/Paystack.interface";

const paystackService = new PaystackService();

interface IListBanksQuery {
  country?: string;
}

export class PaystackController {
  public async listBanks(
    req: Request<{}, {}, {}, IListBanksQuery>,
    res: Response
  ) {
    const country = req.query.country || "nigeria";

    try {
      const result = await paystackService.listBanks(country);

      res.status(200).json({
        status: true,
        message: `Successfully retrieved banks for ${country}.`,
        data: result.data,
        count: result.data.length,
      });
    } catch (error) {
      console.error(
        "List Banks Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      res.status(500).json({
        status: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while listing banks.",
      });
    }
  }
  public async resolveAccount(
    req: Request<{}, {}, IResolveAccountPayload>,
    res: Response
  ) {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        status: false,
        message: "Missing required parameters: accountNumber and bankCode.",
      });
    }

    try {
      const result = await paystackService.resolveAccount({
        accountNumber,
        bankCode,
      });

      res.status(200).json({
        status: true,
        message: "Account name resolved successfully.",
        data: {
          account_name: result.data.account_name,
          account_number: result.data.account_number,
        },
      });
    } catch (error) {
      console.error(
        "Resolve Account Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      res.status(500).json({
        status: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during account resolution.",
      });
    }
  }

  public async validateAccount(
    req: Request<{}, {}, IValidateAccountPayload>,
    res: Response
  ) {
    const payload: IValidateAccountPayload = req.body;

    const requiredFields: (keyof IValidateAccountPayload)[] = [
      "accountNumber",
      "bankCode",
      "countryCode",
      "accountName",
      "accountType",
      "documentType",
      "documentNumber",
    ];

    const missing = requiredFields.filter((field) => !payload[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Missing required fields for validation: ${missing.join(
          ", "
        )}`,
      });
    }

    try {
      const result = await paystackService.validateAccount(payload);

      res.status(200).json({
        status: true,
        message: result.message,
        data: {
          verified: result.data.verified,
          verificationMessage: result.data.verificationMessage,
        },
      });
    } catch (error) {
      console.error(
        "Validate Account Error:",
        error instanceof Error ? error.message : "Unknown error"
      );
      res.status(500).json({
        status: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred during account validation.",
      });
    }
  }
}
