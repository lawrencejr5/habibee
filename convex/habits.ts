import { ConvexError, v } from "convex/values";
import {
  action,
  mutation,
  query,
  internalQuery,
  internalMutation,
} from "./_generated/server";
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
  process.env.GOOGLE_GEMINI_API_KEY as string,
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
    // Allows unsetting timer_start_time (pausing) by passing null

    if (args.timer_start_time !== undefined) {
      fields_to_update.timer_start_time =
        args.timer_start_time === null ? undefined : args.timer_start_time;
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
    sub_habits: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    { habit, icon, theme, duration, goal, strict, sub_habits },
  ) => {
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

    if (sub_habits && sub_habits.length > 0) {
      for (const sh_name of sub_habits) {
        await ctx.db.insert("sub_habits", {
          name: sh_name,
          parent_habit: habit_id,
          completed: false,
        });
      }
    }

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
        q.eq("habit", args.habit_id).eq("date", args.current_date),
      )
      .unique();

    if (streak_recorded)
      throw new ConvexError("Streak already counted for today");

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
          "All sub-habits must be completed before marking this habit as complete",
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
          q.eq("user", user_id).eq("week_day", args.week_day),
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
          q.eq("user", user_id).eq("habit", args.habit!),
        )
        .unique();

      if (existing) {
        throw new ConvexError("Habit with same name already exists");
      }
    }

    const fields_to_update: Record<string, any> = {};
    if (args.habit !== undefined) fields_to_update.habit = args.habit;
    if (args.duration === undefined) fields_to_update.duration = undefined;
    else
      fields_to_update.duration = args.duration
        ? Math.max(1, args.duration)
        : undefined;
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
    if (!user_id) {
      console.log("User not authenticated");
      return;
    }

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("user", user_id))
      .collect();

    for (const habit of habits) {
      // Sub-habits daily reset
      if (habit.last_daily_reset_date !== args.today) {
        // Migration safety: If never reset (undefined) but completed today, assume valid progress
        if (
          !habit.last_daily_reset_date &&
          habit.lastCompleted === args.today
        ) {
          await ctx.db.patch(habit._id, { last_daily_reset_date: args.today });
        } else {
          // Reset sub-habits
          const sub_habits = await ctx.db
            .query("sub_habits")
            .withIndex("by_parent_habit", (q) =>
              q.eq("parent_habit", habit._id),
            )
            .collect();

          for (const sh of sub_habits) {
            if (sh.completed) {
              await ctx.db.patch(sh._id, { completed: false });
            }
          }
          await ctx.db.patch(habit._id, { last_daily_reset_date: args.today });
        }
      }

      // Streak Check
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
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let userContextString = "";

    if (userId) {
      const userData = await ctx.runQuery(
        internal.habits.get_user_context_data,
        {
          userId,
        },
      );

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
                  "duration": 15, // Optional: Only if the habit is time-based. If not, omit this field.
                  "goal": 100, // Target days or frequency
                  "icon": "gym", 
                  "strict": false,
                  "theme": "#3498db",
                  "sub_habits": ["Step 1", "Step 2"] // Optional: Array of strings for sub-habits. Omit if not applicable.
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
          5. "sub_habits" are simple actionable steps to help achieve the main habit.
          6. Keep text CONCISE, supportive, and energetic.
          7. IMPORTANT: Do not include markdown code blocks. Return ONLY raw JSON.
          8. When creating habits, except the user is being specific, generate up to 3 habits so that the user can have options.
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

    cleanResponse = cleanResponse.replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      "",
    );

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
    sub_habits: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    { habit, icon, theme, duration, goal, strict, sub_habits },
  ) => {
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

    if (sub_habits && sub_habits.length > 0) {
      for (const sh_name of sub_habits) {
        await ctx.db.insert("sub_habits", {
          name: sh_name,
          parent_habit: habit_id,
          completed: false,
        });
      }
    }

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

    const habitsWithSubHabits = await Promise.all(
      habits.map(async (h) => {
        const sub_habits = await ctx.db
          .query("sub_habits")
          .withIndex("by_parent_habit", (q) => q.eq("parent_habit", h._id))
          .collect();
        return { ...h, sub_habits };
      }),
    );

    const habitsSummary = habitsWithSubHabits
      .map(
        (h) =>
          `- ${h.habit} (Streak: ${h.current_streak}, Goal: ${h.goal}${h.duration ? `, Duration: ${h.duration}m` : ""}${
            h.sub_habits.length > 0
              ? `, Sub-habits: ${h.sub_habits.map((sh) => sh.name).join(", ")}`
              : ""
          })`,
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

export const internal_record_habit_completion = internalMutation({
  args: {
    habit_id: v.id("habits"),
    current_date: v.string(),
    week_day: v.string(),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Check if already recorded
    const streak_recorded = await ctx.db
      .query("habit_enteries")
      .withIndex("by_habit_date", (q) =>
        q.eq("habit", args.habit_id).eq("date", args.current_date),
      )
      .unique();

    if (streak_recorded) return; // Already recorded

    const habit = await ctx.db.get(args.habit_id);
    if (!habit) return;

    await ctx.db.insert("habit_enteries", {
      user: args.user_id,
      habit: args.habit_id,
      status: "completed",
      date: args.current_date,
    });

    const newStreak = (habit.current_streak ?? 0) + 1;
    const newHighestStreak = Math.max(newStreak, habit.highest_streak ?? 0);

    await ctx.db.patch(args.habit_id, {
      current_streak: newStreak,
      highest_streak: newHighestStreak,
      timer_start_time: undefined,
      timer_elapsed: undefined,
      lastCompleted: args.current_date,
    });

    const user = await ctx.db.get(args.user_id);
    if (!user) return;

    if (user.last_streak_date !== args.current_date) {
      const newUserStreak = (user.streak ?? 0) + 1;
      await ctx.db.patch(args.user_id, {
        streak: newUserStreak,
        last_streak_date: args.current_date,
      });

      const user_weekly_stat = await ctx.db
        .query("weekly_stats")
        .withIndex("by_user_weekday", (q) =>
          q.eq("user", args.user_id).eq("week_day", args.week_day),
        )
        .unique();

      if (user_weekly_stat) {
        await ctx.db.patch(user_weekly_stat._id, {
          date: args.current_date,
        });
      } else {
        await ctx.db.insert("weekly_stats", {
          user: args.user_id,
          week_day: args.week_day,
          date: args.current_date,
        });
      }
    }
  },
});

export const internal_uncheck_habit_completion = internalMutation({
  args: {
    habit_id: v.id("habits"),
    current_date: v.string(),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // 1. Check if recorded today
    const entry = await ctx.db
      .query("habit_enteries")
      .withIndex("by_habit_date", (q) =>
        q.eq("habit", args.habit_id).eq("date", args.current_date),
      )
      .unique();

    if (!entry) return; // Not completed today, nothing to undo

    await ctx.db.delete(entry._id);

    const habit = await ctx.db.get(args.habit_id);
    if (habit) {
      const newStreak = Math.max(0, (habit.current_streak ?? 1) - 1);

      // Find previous completion for lastCompleted
      const prevEntry = await ctx.db
        .query("habit_enteries")
        .withIndex("by_habit_date", (q) => q.eq("habit", args.habit_id))
        .order("desc")
        .first();

      await ctx.db.patch(args.habit_id, {
        current_streak: newStreak,
        lastCompleted: prevEntry?.date, // undefined if no previous
      });
    }

    // Check User Streak
    const otherEntriesToday = await ctx.db
      .query("habit_enteries")
      .withIndex("by_user_date", (q) =>
        q.eq("user", args.user_id).eq("date", args.current_date),
      )
      .first();

    if (!otherEntriesToday && habit) {
      const user = await ctx.db.get(args.user_id);
      if (user && user.last_streak_date === args.current_date) {
        const newStreak = Math.max(0, (user.streak ?? 1) - 1);

        const latestEntry = await ctx.db
          .query("habit_enteries")
          .withIndex("by_user_date", (q) => q.eq("user", args.user_id))
          .order("desc")
          .first();

        await ctx.db.patch(args.user_id, {
          streak: newStreak,
          last_streak_date: latestEntry?.date,
        });
      }
    }
  },
});
