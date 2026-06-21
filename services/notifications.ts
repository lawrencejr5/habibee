import * as Notifications from "expo-notifications";

const GLOBAL_REMINDER_PREFIX = "global-reminder-";

/**
 * Schedule daily local notifications for the three global reminder slots:
 * Morning (8 AM), Evening (6 PM), Night (10 PM) — all in the user's LOCAL timezone.
 * This replaces the server-side UTC crons so every user receives them at the right local time.
 * Safe to call repeatedly — cancels and re-schedules the three slots each time.
 */
export async function scheduleGlobalDailyReminders() {
  const slots = [
    {
      id: `${GLOBAL_REMINDER_PREFIX}morning`,
      hour: 8,
      minute: 0,
      title: "Good Morning Habibee! ☀️",
      body: "Start your day with a win! Complete a habit now.",
    },
    {
      id: `${GLOBAL_REMINDER_PREFIX}evening`,
      hour: 18,
      minute: 0,
      title: "Time for a Nudge! 🔔",
      body: "Don't let the day end without a win.",
    },
    {
      id: `${GLOBAL_REMINDER_PREFIX}night`,
      hour: 23,
      minute: 45,
      title: "STREAK DANGER! 🚨",
      body: "YOUR STREAK IS IN DANGER! Complete your habits before midnight!",
    },
  ];

  for (const slot of slots) {
    try {
      await Notifications.cancelScheduledNotificationAsync(slot.id).catch(
        () => {},
      );
      await Notifications.scheduleNotificationAsync({
        identifier: slot.id,
        content: {
          title: slot.title,
          body: slot.body,
          sound: "habibee_alert.wav",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slot.hour,
          minute: slot.minute,
          channelId: "habibee-alerts",
        },
      });
    } catch (error) {
      console.warn(`Failed to schedule global reminder (${slot.id}):`, error);
    }
  }
}

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
          sound: "habibee_alert.wav",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: "habibee-alerts",
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

const HABIT_REMINDER_PREFIX = "habit-reminder-";

/**
 * Schedule daily repeating local notifications for parent habits that have reminders.
 * Cancels all existing habit reminders first, then re-schedules.
 */
export async function scheduleHabitReminders(
  habits: Array<{
    _id: string;
    habit: string;
    reminder_time?: string;
  }>,
) {
  // Cancel all existing habit reminders first
  await cancelAllHabitReminders();

  for (const h of habits) {
    if (!h.reminder_time) continue;

    const [hourStr, minStr] = h.reminder_time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minStr, 10);

    if (isNaN(hour) || isNaN(minute)) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${HABIT_REMINDER_PREFIX}${h._id}`,
        content: {
          title: `Time for: ${h.habit}`,
          body: `Keep the streak going! It's time for "${h.habit}".`,
          sound: "habibee_alert.wav",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: "habibee-alerts",
        },
      });
    } catch (error) {
      console.warn(`Failed to schedule reminder for ${h.habit}:`, error);
    }
  }
}

/**
 * Cancel all scheduled parent habit reminders.
 */
export async function cancelAllHabitReminders() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith(HABIT_REMINDER_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (error) {
    console.warn("Failed to cancel parent habit reminders:", error);
  }
}

/**
 * Send an immediate local notification when a habit timer completes.
 */
export async function sendTimerCompletedNotification(habitName: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Timer is up! ⏰",
        body: `Your timer for "${habitName}" has finished. Great job!`,
        sound: "habibee_alert.wav",
      },
      trigger: null,
    });
  } catch (error) {
    console.warn("Failed to send timer completed notification:", error);
  }
}

const TIMER_COMPLETED_PREFIX = "timer-completed-";

/**
 * Schedule a local notification to fire when the habit timer completes.
 */
export async function scheduleTimerCompletedNotification(
  habitId: string,
  habitName: string,
  seconds: number,
) {
  if (seconds <= 0) return;
  try {
    // Cancel any existing scheduled notification for this habit first
    await cancelTimerCompletedNotification(habitId);

    await Notifications.scheduleNotificationAsync({
      identifier: `${TIMER_COMPLETED_PREFIX}${habitId}`,
      content: {
        title: "Timer is up! ⏰",
        body: `Your timer for "${habitName}" has finished. Great job!`,
        sound: "habibee_alert.wav",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        channelId: "habibee-alerts",
      },
    });
  } catch (error) {
    console.warn("Failed to schedule timer completed notification:", error);
  }
}

/**
 * Cancel the scheduled timer completed notification for a habit.
 */
export async function cancelTimerCompletedNotification(habitId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      `${TIMER_COMPLETED_PREFIX}${habitId}`,
    );
  } catch (error) {
    console.warn("Failed to cancel timer completed notification:", error);
  }
}
