import { Router } from "express";
import { getAggregatedFxRates } from "@controllers/fx-rates.controller";
import asyncHandler from "../utils/asyncHandler";

const router = Router();
router.get("/", asyncHandler(getAggregatedFxRates));

export const ratesRouter = router;
