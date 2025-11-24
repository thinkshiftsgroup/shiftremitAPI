import cron from "node-cron";
import prisma from "@config/db";
import { fetchAggregatedFxRates } from "@services/fx-rates.service";
import { sendEmail } from "./email";
import { createRateAlertHtmlBody } from "./email";
const CRON_SCHEDULE = "0 */2 * * *";
const TIMEZONE = "Europe/London";

const getLatestNgnToGbpRate = async (): Promise<number> => {
  const latestRate = await prisma.rateHistory.findFirst({
    orderBy: {
      recordedAt: "desc",
    },
    select: {
      rateNGN: true,
    },
  });

  const gbpPerNgn = latestRate?.rateNGN ? 1 / latestRate.rateNGN : 0;
  return gbpPerNgn;
};

const getUsersWithActiveAlerts = async () => {
  return prisma.user.findMany({
    where: {
      isDeleted: false,
      isBanned: false,
      OR: [
        { alertWhenGbpToNgnDropsBelow: { not: null } },
        { alertWhenNgnToGbpDropsBelow: { not: null } },
      ],
      sendMeNotifs: true,
    },
  });
};

export const checkFxRateAlerts = async (): Promise<void> => {
  console.log(`Starting FX Rate Alert Check at ${new Date().toISOString()}`);

  let gbpToNgnRate: number | null = null;
  let ngnToGbpRate: number | null = null;

  try {
    const rates = await fetchAggregatedFxRates();
    gbpToNgnRate = rates?.shiftremit.rate ?? null;
    ngnToGbpRate = await getLatestNgnToGbpRate();
  } catch (error) {
    console.error("Error fetching rates:", error);
    return;
  }

  if (gbpToNgnRate === null || ngnToGbpRate === null) {
    console.log(
      "Could not retrieve all necessary rates. Skipping alert check."
    );
    return;
  }

  const users = await getUsersWithActiveAlerts();

  for (const user of users) {
    if (!user.email) {
      continue;
    }
    if (
      user.alertWhenGbpToNgnDropsBelow !== null &&
      gbpToNgnRate < user.alertWhenGbpToNgnDropsBelow
    ) {
      const subject = "🚨 Rate Alert: GBP to NGN Drop";
      const htmlBody = createRateAlertHtmlBody(
        "GBP to NGN",
        user.alertWhenGbpToNgnDropsBelow,
        gbpToNgnRate
      );
      await sendEmail({ to: user.email, subject, htmlBody });
    }

    if (
      user.alertWhenNgnToGbpDropsBelow !== null &&
      ngnToGbpRate < user.alertWhenNgnToGbpDropsBelow
    ) {
      const subject = "🚨 Rate Alert: NGN to GBP Drop";
      const htmlBody = createRateAlertHtmlBody(
        "NGN to GBP",
        user.alertWhenNgnToGbpDropsBelow,
        ngnToGbpRate
      );
      await sendEmail({ to: user.email, subject, htmlBody });
    }
  }

  console.log("FX Rate Alert Check Finished.");
};

export const startFxAlertCron = () => {
  if (cron.validate(CRON_SCHEDULE)) {
    cron.schedule(
      CRON_SCHEDULE,
      async () => {
        await checkFxRateAlerts();
      },
      {
        timezone: TIMEZONE,
      }
    );
    console.log(
      `FX Rate Alert Cron Job started. Schedule: ${CRON_SCHEDULE} in ${TIMEZONE}.`
    );
  } else {
    console.error(`Invalid CRON schedule: ${CRON_SCHEDULE}`);
  }
};
