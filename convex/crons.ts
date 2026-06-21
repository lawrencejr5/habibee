import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Reset Premium Freezes on the 1st of every month at midnight UTC
crons.monthly(
  "Reset Premium User Freezes",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.users.reset_premium_freezes_cron,
);

export default crons;
