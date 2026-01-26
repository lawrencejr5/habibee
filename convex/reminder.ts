import { internalAction } from "./_generated/server";

export const sendSmartReminder = internalAction({
  handler: async (ctx, { pushToken, streakCount }) => {
    const messages = [
      `Your ${streakCount}-day streak is in danger!`,
      "Just 2 minutes of habits can change your life. Start now!",
    ];
    const body = messages[Math.floor(Math.random() * messages.length)];

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      body: JSON.stringify({
        to: pushToken,
        title: "Habibee",
        body: body,
        sound: "default",
      }),
    });
  },
});
