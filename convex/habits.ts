import { ConvexError, v } from "convex/values";
import { action, mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
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

export const update_habit_timer = mutation({
  args: {
    habit_id: v.id("habits"),
    timer_start_time: v.optional(v.union(v.number(), v.null())),
    timer_elapsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit not found");

    if (habit.user !== user_id) throw new Error("Unauthorized");

    const fields_to_update: any = {};
    if (args.timer_start_time !== undefined)
      fields_to_update.timer_start_time = args.timer_start_time;
    // We allow setting timer_start_time to null explicitly if passed as null (for pausing),
    // but Convex v.optional(v.number()) might not strictly support null if not unioned with v.null().
    // However, usually omitting it or setting undefined is how optional works.
    // To support "pausing" (clearing start time), we might need to handle null.
    // Let's rely on args logic: if we want to "unset" it, we might need a specific handling or just use 0 or undefined.
    // Wait, v.optional(v.number()) means number | undefined. It doesn't include null.
    // If I want to clear it, I should probably use undefined.
    // But how do I send "undefined" from client?
    // Let's check how Convex handles partial updates. `db.patch` will update fields present in the object.
    // If I want to "delete" a field or set it to undefined, usually I just send undefined?
    // Actually, to remove a field in Convex, you usually set it to undefined in patch.
    // Let's refine the mutation args to allow clearing.

    // Re-reading Convex docs approach:
    // Ideally use v.union(v.number(), v.null()) if we want to explicitly set null.
    // Or just v.optional(v.number()).
    // Let's stick to the plan: pass `null` or `undefined`.
    // If I want to PAUSE, I need `timer_start_time` to be cleared.
    // Code below assumes `args.timer_start_time` can be null?
    // `v.optional(v.number())` validation will fail if I pass null.
    // So I should use `v.union(v.number(), v.null())` if I want to pass null.
    // Or simpler: I'll use a specific flag or just expect `undefined`.
    // But can I pass `undefined` over the wire? No, JSON doesn't produce undefined. It produces null or missing key.
    // So correct schema for a nullable field is `v.optional(v.union(v.number(), v.null()))` or just `v.union(v.number(), v.null())`.
    // BUT, `v.optional` in `schema.ts` usually just means the field might be missing.
    // If I want to WRITE a "missing" state, I might need to follow specific Convex pattern.
    // Actually simpler: `timer_start_time` is number. If 0, it's not started? No timestamp can be anything.
    // Let's look at `schema.ts` again. I defined it as `v.optional(v.number())`.
    // In `update_habit_timer`, I'll define args as `timer_start_time: v.optional(v.union(v.number(), v.null()))`.
    // And if null, I set it to undefined in the patch?

    // Let's try `v.optional(v.number())` strictly first. If I want to "pause", I won't send `timer_start_time`?
    // No, I need to UPDATE it to be empty.
    // The previous `update_habit` mutation does `if (args.habit !== undefined)`.
    // If I want to UNSET `timer_start_time`, I need to receive a signal.
    // Let's use `v.union(v.number(), v.null())` for `timer_start_time` in arguments so I can explicitly pass `null`.

    if (args.timer_start_time !== undefined) {
      fields_to_update.timer_start_time = args.timer_start_time === null ? undefined : args.timer_start_time;
    }

    if (args.timer_elapsed !== undefined)
      fields_to_update.timer_elapsed = args.timer_elapsed;

    await ctx.db.patch(args.habit_id, fields_to_update);
  },
});

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
    duration: v.optional(v.number()),
    goal: v.number(),
    strict: v.boolean(),
  },
  handler: async (ctx, { habit, icon, theme, duration, goal, strict }) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("User is not authenticated");

    const existing = await ctx.db
      .query("habits")
      .withIndex("by_user_habit", (q) => q.eq("user", user).eq("habit", habit))
      .unique();

    if (existing) {
      throw new ConvexError("Habit with same name already exists");
    }

    const habit_id = await ctx.db.insert("habits", {
      user,
      habit,
      icon,
      theme,
      duration: duration && Math.max(1, duration),
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
      throw new ConvexError(
        "Streak already counted for today"
      );

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) throw new Error("Habit does not exist");

    // Check if habit has sub-habits
    const sub_habits = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) => q.eq("parent_habit", args.habit_id))
      .collect();

    // If habit has sub-habits, verify all are completed
    if (sub_habits.length > 0) {
      const allCompleted = sub_habits.every((sh) => sh.completed);
      if (!allCompleted) {
        throw new ConvexError(
          "All sub-habits must be completed before marking this habit as complete"
        );
      }
    }

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

    // Reset all sub-habits after successful completion
    if (sub_habits.length > 0) {
      for (const sub_habit of sub_habits) {
        await ctx.db.patch(sub_habit._id, { completed: false });
      }
    }

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

    if (args.habit !== undefined && args.habit !== habit_exists.habit) {
      const existing = await ctx.db
        .query("habits")
        .withIndex("by_user_habit", (q) =>
          q.eq("user", user_id).eq("habit", args.habit!)
        )
        .unique();

      if (existing) {
        throw new ConvexError("Habit with same name already exists");
      }
    }

    const fields_to_update: Record<string, any> = {};
    if (args.habit !== undefined) fields_to_update.habit = args.habit;
    if (args.duration !== undefined)
      fields_to_update.duration = args.duration ? Math.max(1, args.duration) : undefined;
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

    // Delete all associated sub-habits
    const sub_habits = await ctx.db
      .query("sub_habits")
      .withIndex("by_parent_habit", (q) => q.eq("parent_habit", args.habit_id))
      .collect();

    for (const sub_habit of sub_habits) {
      await ctx.db.delete(sub_habit._id);
    }

    await ctx.db.delete(args.habit_id);
    return { msg: "Habit deleted", habit: args.habit_id };
  },
});

export const check_streak_and_reset = mutation({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) { console.log("User not authenticated"); return };

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
    const userId = await getAuthUserId(ctx);
    let userContextString = "";

    if (userId) {
      const userData = await ctx.runQuery(internal.habits.get_user_context_data, {
        userId,
      });

      if (userData) {
        userContextString = `
          USER CONTEXT:
          - Name: ${userData.fullname}
          - Current Daily Streak: ${userData.streak} days
          - Total Habits: ${userData.totalHabits}
          - Active Habits: ${userData.habitsSummary}
        `;
      }
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: {
        parts: [
          {
            text: `
          You are Habibee, an intelligent Habit Coach developed by Lawjun technologies owned by Oputa Lawrence.
          
          ${userContextString}

          RESPONSE FORMAT INSTRUCTIONS:
          You must ALWAYS return a valid JSON object.
          
          Structure:
          {
            "response": [
              { "type": "text", "content": "..." },
              // Optional: Only include habit if suggesting a specific new habit
              { 
                "type": "habit", 
                "content": {
                  "habit": "Habit Name",
                  "duration": 15,
                  "goal": 100, // Target days or frequency
                  "icon": "gym", 
                  "strict": false,
                  "theme": "#3498db"
                } 
              }
            ]
          }

          ICONS (Strictly choose from this list):
          ${AVAILABLE_ICONS.join(", ")}

          THEMES (Strictly choose from this list):
          ${AVAILABLE_COLORS.join(", ")}

          RULES:
          1. Mix "text" and "habit" parts naturally. 
          2. YOU ARE INQUISITIVE. If you need more info just return a "text" part.
          3. ONLY return a "habit" part if you are proposing a concrete habit for the user to save.
          4. "goal" usually implies target days (e.g. 100 days). "duration" is minutes per day.
          5. Keep text CONCISE, supportive, and energetic.
          6. IMPORTANT: Do not include markdown code blocks. Return ONLY raw JSON.
          7. When creating habits, except the user is being specific, generate up to 3 habits so that the user can have options
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

    // Improved JSON extraction using regex to find the first '{' and the last '}'
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    let cleanResponse = jsonMatch ? jsonMatch[0] : response;


    cleanResponse = cleanResponse.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

    return cleanResponse;
  },
});

export const create_habit = mutation({
  args: {
    habit: v.string(),
    icon: v.string(),
    theme: v.string(),
    duration: v.optional(v.number()),
    goal: v.number(),
    strict: v.boolean(),
  },
  handler: async (ctx, { habit, icon, theme, duration, goal, strict }) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("User is not authenticated");

    const existing = await ctx.db
      .query("habits")
      .withIndex("by_user_habit", (q) => q.eq("user", user).eq("habit", habit))
      .unique();

    if (existing) {
      throw new ConvexError("Habit with same name already exists");
    }

    const habit_id = await ctx.db.insert("habits", {
      user,
      habit,
      icon,
      theme,
      duration: duration ? Math.max(1, duration) : undefined,
      goal,
      strict,
      current_streak: 0,
      highest_streak: 0,
    });


    return habit_id;
  },
});

export const get_user_context_data = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("user", args.userId))
      .collect();

    const habitsSummary = habits
      .map(
        (h) =>
          `- ${h.habit} (Streak: ${h.current_streak}, Goal: ${h.goal}${h.duration ? `, Duration: ${h.duration}m` : ""})`
      )
      .join("\n");

    return {
      fullname: user.fullname,
      streak: user.streak || 0,
      totalHabits: habits.length,
      habitsSummary: habitsSummary || "No active habits yet.",
    };
  },
});
