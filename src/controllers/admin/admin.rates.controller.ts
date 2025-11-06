import { Request, Response, NextFunction } from "express";
import {
  getOrCreateRates,
  updateRates,
} from "@services/admin/admin.rates.service";

interface UpdateRatesRequestBody {
  benchmarkGBP?: number;
  rateNGN?: number;
}

export const getCurrentRates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rates = await getOrCreateRates();

    res.status(200).json({
      success: true,
      data: rates,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCurrentRates = async (
  req: Request<{}, {}, UpdateRatesRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { benchmarkGBP, rateNGN } = req.body;

    if (benchmarkGBP === undefined && rateNGN === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide benchmarkGBP or rateNGN for update.",
      });
    }

    const updatedRates = await updateRates({ benchmarkGBP, rateNGN });

    res.status(200).json({
      success: true,
      message: "Rates updated successfully.",
      data: updatedRates,
    });
  } catch (error) {
    next(error);
  }
};
