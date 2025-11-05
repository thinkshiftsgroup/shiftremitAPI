import { Request, Response } from "express";
import { fetchAggregatedFxRates } from "@services/fx-rates.service";

export const getAggregatedFxRates = async (req: Request, res: Response) => {
  try {
    const data = await fetchAggregatedFxRates();
    res.status(200).json({
      status: "success",
      data: data,
    });
  } catch (error) {
    console.error("Controller Error fetching FX rates:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch aggregated FX rates",
    });
  }
};
