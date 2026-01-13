import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { getDaysDifference } from "./utils";

// Available habit icons that can be suggested by AI
const AVAILABLE_ICONS = [
  "pray",
  "gym",
  "book",
  "code",
  "meditate",
  "write",
  "water",
  "steps",
  "heart",
  "brain",
  "paint",
  "note",
  "save",
  "money",
  "flower",
];

// Available theme colors
const AVAILABLE_COLORS = [
  "#c5c9cc",
  "#9b59b6",
  "#e74c3c",
  "#3498db",
  "#1abc9c",
  "#e67e22",
];

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY as string
);

export const get_user_habits = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unathenticated");

    const user_habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("user", user))
      .order("desc")
      .collect();
    return user_habits;
  },
});

export const add_habit = mutation({
  args: {
    habit: v.string(),
    icon: v.string(),
    theme: v.string(),
    duration: v.number(),
    goal: v.number(),
    strict: v.boolean(),
  },
  handler: async (ctx, { habit, icon, theme, duration, goal, strict }) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("User is not authenticated");

    const habit_id = await ctx.db.insert("habits", {
      user,
      habit,
      icon,
      theme,
      duration: Math.max(1, duration),
      goal: Math.max(1, goal),
      strict,
      current_streak: 0,
      highest_streak: 0,
    });

    return habit_id;
  },
});

export const record_streak = mutation({
  args: {
    habit_id: v.id("habits"),
    current_date: v.string(),
    week_day: v.string(),
  },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const streak_recorded = await ctx.db
      .query("habit_enteries")
      .withIndex("by_habit_date", (q) =>
        q.eq("habit", args.habit_id).eq("date", args.current_date)
      )
      .unique();

    if (streak_recorded)
      throw new Error(
        "Streak has already been counted for today " + `${args.current_date}`
      );

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit does not exist");

    await ctx.db.insert("habit_enteries", {
      user: user_id,
      habit: args.habit_id,
      status: "completed",
      date: args.current_date,
    });

    const newStreak = (habit.current_streak ?? 0) + 1;
    const newHighestStreak = Math.max(newStreak, habit.highest_streak ?? 0);

    await ctx.db.patch(args.habit_id, {
      current_streak: newStreak,
      highest_streak: newHighestStreak,
      lastCompleted: args.current_date,
    });

    const user = await ctx.db.get(user_id);
    if (!user) throw new Error("User not found");

    if (user.last_streak_date !== args.current_date) {
      const newUserStreak = (user.streak ?? 0) + 1;
      await ctx.db.patch(user_id, {
        streak: newUserStreak,
        last_streak_date: args.current_date,
      });

      const user_weekly_stat = await ctx.db
        .query("weekly_stats")
        .withIndex("by_user_weekday", (q) =>
          q.eq("user", user_id).eq("week_day", args.week_day)
        )
        .unique();

      if (user_weekly_stat) {
        await ctx.db.patch(user_weekly_stat._id, {
          date: args.current_date,
        });
      } else {
        await ctx.db.insert("weekly_stats", {
          user: user_id,
          week_day: args.week_day,
          date: args.current_date,
        });
      }
    }
  },
});

export const update_habit = mutation({
  args: {
    habit_id: v.id("habits"),
    habit: v.optional(v.string()),
    duration: v.optional(v.number()),
    goal: v.optional(v.number()),
    strict: v.optional(v.boolean()),
    icon: v.optional(v.string()),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated, couldn't find user");

    const habit_exists = await ctx.db.get(args.habit_id);
    if (!habit_exists) throw new Error("Habit not found");

    if (user_id !== habit_exists.user) throw new Error("");

    const fields_to_update: Record<string, any> = {};
    if (args.habit !== undefined) fields_to_update.habit = args.habit;
    if (args.duration !== undefined)
      fields_to_update.duration = Math.max(1, args.duration);
    if (args.goal !== undefined) fields_to_update.goal = Math.max(1, args.goal);
    if (args.strict !== undefined) fields_to_update.strict = args.strict;
    if (args.icon !== undefined) fields_to_update.icon = args.icon;
    if (args.theme !== undefined) fields_to_update.theme = args.theme;

    await ctx.db.patch(args.habit_id, fields_to_update);
    return { msg: "success", habit: args.habit_id };
  },
});

export const delete_habit = mutation({
  args: { habit_id: v.id("habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit not found");

    const habit_enteries = await ctx.db
      .query("habit_enteries")
      .withIndex("by_habit_date", (q) => q.eq("habit", args.habit_id))
      .collect();

    if (habit_enteries) {
      for (const entry of habit_enteries) {
        await ctx.db.delete(entry._id);
      }
    }

    await ctx.db.delete(args.habit_id);
    return { msg: "Habit deleted", habit: args.habit_id };
  },
});

export const check_streak_and_reset = mutation({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("User not authenticated");

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("user", user_id))
      .collect();

    for (const habit of habits) {
      if (!habit.lastCompleted || habit.current_streak === 0) continue;

      const diff = getDaysDifference(habit.lastCompleted, args.today);
      if (diff > 1) {
        await ctx.db.patch(habit._id, { current_streak: 0 });
      }
    }

    const user = await ctx.db.get(user_id);

    if (!user?.last_streak_date || user.streak === 0) return;

    const diff = getDaysDifference(user.last_streak_date, args.today);
    if (diff > 1) await ctx.db.patch(user_id, { streak: 0 });
  },
});

export const get_habit_enteries = query({
  args: { habit_id: v.id("habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("User not authenticated");

    const enteries = await ctx.db
      .query("habit_enteries")
      .withIndex("by_habit_date", (q) => q.eq("habit", args.habit_id))
      .collect();

    return enteries;
  },
});

export const generate_habit_ai = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("model")),
        parts: v.array(
          v.object({
            text: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        parts: [
          {
            text: `
          You are Habibee, an intelligent Habit Coach and productivity assistant. 
          Your goal is to help the user build consistent, trackable routines.

          YOUR RULES:
          1. BE CONCISE: The user is on a mobile app. Keep responses short and easy to read.
          2. BE INQUISITIVE: If a user shares a vague goal (e.g., "I want to be stronger"), do not just list habits. First, ask clarifying questions (e.g., "Do you have access to a gym, or do you prefer home workouts?").
          3. BE STRUCTURED: When suggesting habits, always imply a frequency (daily, weekly).
          4. TONE: Energetic, disciplined, and supportive. Use emojis occasionally (💪, 🚀).
          5. IDENTITY: Your name is Habibee. You are a Habit Machine.
        `,
          },
        ],
        role: "model",
      },
    });

    const result = await model.generateContent({
      contents: [...args.messages],
    });

    const response = result.response.text();
    console.log(response);
    return response;
  },
});

export const create_habit = mutation({
  args: {
    habit: v.string(),
    icon: v.string(),
    theme: v.string(),
    duration: v.number(),
    goal: v.number(),
    strict: v.boolean(),
  },
  handler: async (ctx, { habit, icon, theme, duration, goal, strict }) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("User is not authenticated");

    const habit_id = await ctx.db.insert("habits", {
      user,
      habit,
      icon,
      theme,
      duration,
      goal,
      strict,
      current_streak: 0,
      highest_streak: 0,
    });

    return habit_id;
  },
});
