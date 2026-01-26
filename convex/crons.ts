import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Morning Reminder: 8:00 AM UTC
crons.daily(
  "Morning Reminder",
  { hourUTC: 7, minuteUTC: 0 },
  internal.reminder.checkAndSendMorningReminders,
);

// Evening Reminder: 6:00 PM UTC (18:00)
crons.daily(
  "Evening Reminder",
  { hourUTC: 17, minuteUTC: 0 },
  internal.reminder.checkAndSendEveningReminders,
);

// Night/Danger Reminder: 11:00 PM UTC (23:00)
crons.daily(
  "Night Reminder",
  { hourUTC: 22, minuteUTC: 0 },
  internal.reminder.checkAndSendNightReminders,
);

export default crons;
