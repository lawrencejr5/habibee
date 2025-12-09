import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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
    }
  },
});
