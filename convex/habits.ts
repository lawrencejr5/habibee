import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

// Habit suggestions database - maps keywords to habit data
const HABIT_SUGGESTIONS: Record<
  string,
  {
    habit: string;
    icon: string;
    duration: number;
    goal: number;
  }[]
> = {
  fitness: [
    { habit: "Morning Workout", icon: "gym", duration: 30, goal: 1 },
    { habit: "Running", icon: "steps", duration: 30, goal: 1 },
    { habit: "Yoga", icon: "meditate", duration: 21, goal: 1 },
  ],
  reading: [
    { habit: "Read Daily", icon: "book", duration: 30, goal: 1 },
    { habit: "Read Before Sleep", icon: "book", duration: 30, goal: 1 },
  ],
  productivity: [
    { habit: "Coding Practice", icon: "code", duration: 30, goal: 1 },
    { habit: "Write Daily", icon: "write", duration: 21, goal: 1 },
    { habit: "Journal", icon: "note", duration: 30, goal: 1 },
  ],
  health: [
    { habit: "Drink Water", icon: "water", duration: 30, goal: 8 },
    { habit: "Meditation", icon: "meditate", duration: 21, goal: 1 },
    { habit: "Sleep Early", icon: "brain", duration: 21, goal: 1 },
  ],
  mindfulness: [
    { habit: "Daily Meditation", icon: "meditate", duration: 30, goal: 1 },
    { habit: "Gratitude Practice", icon: "note", duration: 30, goal: 1 },
  ],
  creative: [
    { habit: "Painting", icon: "paint", duration: 21, goal: 1 },
    { habit: "Drawing", icon: "paint", duration: 30, goal: 1 },
    { habit: "Creative Writing", icon: "write", duration: 21, goal: 1 },
  ],
  learning: [
    { habit: "Learn Something New", icon: "brain", duration: 30, goal: 1 },
    { habit: "Online Course", icon: "code", duration: 60, goal: 1 },
  ],
  financial: [
    { habit: "Save Money", icon: "save", duration: 30, goal: 1 },
    { habit: "Budget Review", icon: "money", duration: 30, goal: 1 },
  ],
  spiritual: [
    { habit: "Prayer", icon: "pray", duration: 30, goal: 1 },
    { habit: "Spiritual Reading", icon: "book", duration: 21, goal: 1 },
  ],
};

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
      duration,
      goal,
      strict,
      current_streak: 0,
      highest_streak: 0,
    });

    return habit_id;
  },
});

export const record_streak = mutation({
  args: { habit_id: v.id("habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const current_date = new Date().toISOString().split("T")[0];

    const streak_recorded = await ctx.db
      .query("habit_enteries")
      .withIndex("by_habit_date", (q) =>
        q.eq("habit", args.habit_id).eq("date", current_date)
      )
      .unique();

    if (streak_recorded)
      throw new Error("Streak has already been counted for today");

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit does not exist");

    await ctx.db.insert("habit_enteries", {
      user: user_id,
      habit: args.habit_id,
      status: "completed",
      date: current_date,
    });

    const newStreak = (habit.current_streak ?? 0) + 1;
    const newHighestStreak = Math.max(newStreak, habit.highest_streak ?? 0);

    await ctx.db.patch(args.habit_id, {
      current_streak: newStreak,
      highest_streak: newHighestStreak,
      lastCompleted: current_date,
    });

    const user = await ctx.db.get(user_id);
    if (!user) throw new Error("User not found");

    if (user.last_streak_date !== current_date) {
      const newUserStreak = (user.streak ?? 0) + 1;
      await ctx.db.patch(user_id, {
        streak: newUserStreak,
        last_streak_date: current_date,
      });

      const week_day = new Date().toLocaleDateString("en-US", {
        weekday: "short",
      });
      await ctx.db.insert("weekly_stats", {
        user: user_id,
        week_day,
        date: current_date,
      });
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
    if (args.duration !== undefined) fields_to_update.duration = args.duration;
    if (args.goal !== undefined) fields_to_update.goal = args.goal;
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
    if (!user_id) throw new Error("User is not authenticated");

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

export const generate_habit_ai = mutation({
  args: {
    userInput: v.string(),
  },
  handler: async (ctx, args) => {
    return;
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
