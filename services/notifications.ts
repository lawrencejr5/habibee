import * as Notifications from "expo-notifications";

const SUB_HABIT_REMINDER_PREFIX = "subhabit-reminder-";

/**
 * Schedule daily repeating local notifications for sub-habits that have reminders.
 * Cancels all existing sub-habit reminders first, then re-schedules.
 */
export async function scheduleSubHabitReminders(
  subHabits: Array<{
    _id: string;
    name: string;
    reminder_time?: string;
    parent_habit: string;
  }>,
  habitsMap: Record<string, string>, // habitId -> habitName
) {
  // Cancel all existing sub-habit reminders first
  await cancelAllSubHabitReminders();

  for (const sh of subHabits) {
    if (!sh.reminder_time) continue;

    const [hourStr, minStr] = sh.reminder_time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (isNaN(hour) || isNaN(minute)) continue;

    const parentName = habitsMap[sh.parent_habit] || "your habit";

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${SUB_HABIT_REMINDER_PREFIX}${sh._id}`,
        content: {
          title: `Time for: ${sh.name}`,
          body: `Don't forget "${sh.name}" for ${parentName}!`,
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch (error) {
      console.warn(`Failed to schedule reminder for ${sh.name}:`, error);
    }
  }
}

/**
 * Cancel all scheduled sub-habit reminders.
 */
export async function cancelAllSubHabitReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith(SUB_HABIT_REMINDER_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn("Failed to cancel sub-habit reminders:", error);
  }
}
