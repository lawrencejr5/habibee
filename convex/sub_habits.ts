import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query to get all sub-habits for a parent habit
export const get_sub_habits = query({
  args: { parent_habit_id: v.id("habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    // Verify the parent habit belongs to the user
    const parent_habit = await ctx.db.get(args.parent_habit_id);
    if (!parent_habit) throw new Error("Parent habit not found");
    if (parent_habit.user !== user_id) throw new Error("Unauthorized");

    const sub_habits = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) =>
        q.eq("parent_habit", args.parent_habit_id),
      )
      .collect();

    return sub_habits;
  },
});

// Query to get all sub-habits for the current user (mapped by parent_habit)
export const get_user_sub_habits = query({
  args: {},
  handler: async (ctx) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    // 1. Get all habits for the user
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("user", user_id))
      .collect();

    // 2. Fetch sub-habits for each habit
    // This results in N queries, which is acceptable for a single user's habit list
    const subHabitsPromises = habits.map((habit) =>
      ctx.db
        .query("sub_habits")
        .withIndex("by_parent_habit", (q) => q.eq("parent_habit", habit._id))
        .collect(),
    );

    const subHabitsResults = await Promise.all(subHabitsPromises);

    // Flatten the results
    return subHabitsResults.flat();
  },
});

// Mutation to add a sub-habit
export const add_sub_habit = mutation({
  args: {
    parent_habit_id: v.id("habits"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    // Verify the parent habit belongs to the user
    const parent_habit = await ctx.db.get(args.parent_habit_id);
    if (!parent_habit) throw new Error("Parent habit not found");
    if (parent_habit.user !== user_id) throw new Error("Unauthorized");

    // Check if sub-habit with same name already exists for this parent
    const existing = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) =>
        q.eq("parent_habit", args.parent_habit_id),
      )
      .collect();

    const duplicate = existing.find(
      (sh) => sh.name.toLowerCase() === args.name.toLowerCase(),
    );

    if (duplicate) {
      throw new ConvexError("Sub-habit with same name already exists");
    }

    const sub_habit_id = await ctx.db.insert("sub_habits", {
      name: args.name,
      parent_habit: args.parent_habit_id,
      completed: false,
    });

    return sub_habit_id;
  },
});

import { internal } from "./_generated/api";

// Mutation to toggle sub-habit completion
export const toggle_sub_habit = mutation({
  args: {
    sub_habit_id: v.id("sub_habits"),
    current_date: v.optional(v.string()),
    week_day: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const sub_habit = await ctx.db.get(args.sub_habit_id);
    if (!sub_habit) throw new Error("Sub-habit not found");

    // Verify the parent habit belongs to the user
    const parent_habit = await ctx.db.get(sub_habit.parent_habit);
    if (!parent_habit) throw new Error("Parent habit not found");
    if (parent_habit.user !== user_id) throw new Error("Unauthorized");

    // Toggle the completed status
    const newCompleted = !sub_habit.completed;
    await ctx.db.patch(args.sub_habit_id, {
      completed: newCompleted,
    });

    // if (args.current_date && args.week_day) {
    //   if (newCompleted) {
    //     // Check if all sub-habits are now completed
    //     const all_sub_habits = await ctx.db
    //       .query("sub_habits")
    //       .withIndex("by_parent_habit", (q) =>
    //         q.eq("parent_habit", sub_habit.parent_habit),
    //       )
    //       .collect();

    //     const allDone = all_sub_habits.every((sh) => sh.completed);
    //     if (allDone) {
    //       await ctx.runMutation(
    //         internal.habits.internal_record_habit_completion,
    //         {
    //           habit_id: sub_habit.parent_habit,
    //           user_id,
    //           current_date: args.current_date,
    //           week_day: args.week_day,
    //         },
    //       );
    //     }
    //   } else {
    //     // If unchecked, unstreak the parent habit
    //     await ctx.runMutation(
    //       internal.habits.internal_uncheck_habit_completion,
    //       {
    //         habit_id: sub_habit.parent_habit,
    //         user_id,
    //         current_date: args.current_date,
    //       },
    //     );
    //   }
    // }

    return { completed: newCompleted };
  },
});

// Mutation to delete a sub-habit
export const delete_sub_habit = mutation({
  args: { sub_habit_id: v.id("sub_habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const sub_habit = await ctx.db.get(args.sub_habit_id);
    if (!sub_habit) throw new Error("Sub-habit not found");

    // Verify the parent habit belongs to the user
    const parent_habit = await ctx.db.get(sub_habit.parent_habit);
    if (!parent_habit) throw new Error("Parent habit not found");
    if (parent_habit.user !== user_id) throw new Error("Unauthorized");

    await ctx.db.delete(args.sub_habit_id);
    return { msg: "Sub-habit deleted", sub_habit_id: args.sub_habit_id };
  },
});

// Mutation to update/rename a sub-habit
export const update_sub_habit = mutation({
  args: {
    sub_habit_id: v.id("sub_habits"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const sub_habit = await ctx.db.get(args.sub_habit_id);
    if (!sub_habit) throw new Error("Sub-habit not found");

    // Verify the parent habit belongs to the user
    const parent_habit = await ctx.db.get(sub_habit.parent_habit);
    if (!parent_habit) throw new Error("Parent habit not found");
    if (parent_habit.user !== user_id) throw new Error("Unauthorized");

    // Check if another sub-habit with same name already exists for this parent
    const existing = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) =>
        q.eq("parent_habit", sub_habit.parent_habit),
      )
      .collect();

    const duplicate = existing.find(
      (sh) =>
        sh._id !== args.sub_habit_id &&
        sh.name.toLowerCase() === args.name.toLowerCase(),
    );

    if (duplicate) {
      throw new ConvexError("Sub-habit with same name already exists");
    }

    await ctx.db.patch(args.sub_habit_id, {
      name: args.name,
    });

    return { msg: "Sub-habit updated", sub_habit_id: args.sub_habit_id };
  },
});

// Query to check if a habit has sub-habits
export const has_sub_habits = query({
  args: { habit_id: v.id("habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit not found");
    if (habit.user !== user_id) throw new Error("Unauthorized");

    const sub_habits = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) => q.eq("parent_habit", args.habit_id))
      .collect();

    return sub_habits.length > 0;
  },
});

// Query to check if all sub-habits are completed
export const all_sub_habits_completed = query({
  args: { habit_id: v.id("habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit not found");
    if (habit.user !== user_id) throw new Error("Unauthorized");

    const sub_habits = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) => q.eq("parent_habit", args.habit_id))
      .collect();

    // If no sub-habits exist, return false
    if (sub_habits.length === 0) return false;

    // Check if all sub-habits are completed
    return sub_habits.every((sh) => sh.completed);
  },
});

// Mutation to reset all sub-habits completion status (called after recording streak)
export const reset_sub_habits = mutation({
  args: { habit_id: v.id("habits") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit not found");
    if (habit.user !== user_id) throw new Error("Unauthorized");

    const sub_habits = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) => q.eq("parent_habit", args.habit_id))
      .collect();

    // Reset all sub-habits to not completed
    for (const sub_habit of sub_habits) {
      await ctx.db.patch(sub_habit._id, { completed: false });
    }

    return { msg: "Sub-habits reset", count: sub_habits.length };
  },
});
