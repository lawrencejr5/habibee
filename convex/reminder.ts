import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const MORNING_MESSAGES = [
  "Rise and shine! Your goals are waiting for you.",
  "Start your day with a win! Complete a habit now.",
  "Grab your coffee and crush your habits!",
  "New day, new opportunities to build your streak.",
  "Consistency starts in the morning. Let's go!",
  "Focus on your goals today. You got this!",
  "A small habit now sets the tone for the whole day.",
  "Good morning! Time to be productive.",
  "Charge up your day with a completed habit.",
  "Make today count. Start with one habit.",
];

const EVENING_MESSAGES = [
  "Hey! Just checking in on your habits.",
  "The sun is setting. Have you finished your habits?",
  "Gentle reminder: Don't forget your daily goals.",
  "Take a moment to complete a habit this evening.",
  "Don't let the day end without a win.",
  "Have you checked off your habits today?",
  "The day is almost over. Time for a quick habit.",
  "Evening is a great time for consistency.",
  "Just a quick nudge to keep your streak alive.",
  "Wrap up your day with a sense of accomplishment.",
];

const NIGHT_MESSAGES = [
  "YOUR STREAK IS IN DANGER! ACT NOW!",
  "Do you really want to break your streak after all this work?",
  "Tick tock! The day is almost over!",
  "It's now or never! Complete your habits immediately!",
  "Don't break my heart... and your streak.",
  "I'm begging you, just do one habit!",
  "Your streak is about to die. Save it!",
  "STOP SCROLLING AND DO YOUR HABITS!",
  "Don't make me cry. Keep the streak alive!",
  "LAST CHANCE! Save your progress now!",
  "Your streak will haunt you if you lose it tonight.",
  "Cold streaks are lonely. Keep yours burning!",
  "Emergency! Streak support needed immediately!",
  "Zero is a lonely number. Don't go back to zero.",
  "The streak police are watching. Do it now!",
  "This message will self-destruct... along with your streak.",
  "I see you haven't finished yet...",
  "Don't go to bed with regrets (and a broken streak).",
  "RED ALERT: Habit incomplete!",
  "This is the end... unless you act fast!",
];

function getCreativeMessage(type: "morning" | "evening" | "night"): string {
  let messages;
  switch (type) {
    case "morning":
      messages = MORNING_MESSAGES;
      break;
    case "evening":
      messages = EVENING_MESSAGES;
      break;
    case "night":
      messages = NIGHT_MESSAGES;
      break;
  }
  return messages[Math.floor(Math.random() * messages.length)];
}

async function sendPush(pushTokens: string[], title: string, body: string) {
  if (pushTokens.length === 0) return;

  const notifications = pushTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
  }));

  // Expo recommends splitting into batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    try {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });
    } catch (error) {
      console.error("Error sending push batch:", error);
    }
  }
}

export const checkAndSendMorningReminders = internalAction({
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.users.getAllUsersWithTokens);

    // Flatten all tokens
    const allTokens: string[] = [];
    users.forEach((u: any) => {
      if (u.pushTokens) allTokens.push(...u.pushTokens);
    });

    const message = getCreativeMessage("morning");
    await sendPush(allTokens, "Good Morning Habibee! ☀️", message);
  },
});

export const checkAndSendEveningReminders = internalAction({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];

    // Use the accurate per-habit completion check
    const users = await ctx.runQuery(
      internal.habits.getUsersWithIncompleteHabitsToday,
      { today },
    );

    const allTokens: string[] = [];
    users.forEach((u: any) => {
      if (u.pushTokens) allTokens.push(...u.pushTokens);
    });

    if (allTokens.length === 0) return;

    const message = getCreativeMessage("evening");
    await sendPush(allTokens, "Time for a Nudge! 🔔", message);
  },
});

export const checkAndSendNightReminders = internalAction({
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];

    // Use the accurate per-habit completion check
    const users = await ctx.runQuery(
      internal.habits.getUsersWithIncompleteHabitsToday,
      { today },
    );

    const allTokens: string[] = [];
    users.forEach((u: any) => {
      if (u.pushTokens) allTokens.push(...u.pushTokens);
    });

    if (allTokens.length === 0) return;

    const message = getCreativeMessage("night");
    await sendPush(allTokens, "STREAK DANGER! 🚨", message);
  },
});

const NUDGE_MESSAGES = [
  "Hey, let's keep that streak going! 🚀",
  "Don't forget your habits for today! 💪",
  "Your hive is counting on you! 🐝",
  "A little nudge to get you moving today! ✨",
  "Time to crush those goals! 🔥",
  "Just a friendly nudge! You've got this! 😁",
];

export const send_nudge_notification = action({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Unauthorized");
    
    const data = await ctx.runQuery(internal.users.getNudgeData, { 
      senderId, 
      targetId: args.targetUserId 
    });
    
    if (!data || !data.targetPushTokens || data.targetPushTokens.length === 0) return;
    
    const message = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
    const title = `🐝 @${data.senderUsername}`;
    
    await sendPush(data.targetPushTokens, title, message);
  }
});
