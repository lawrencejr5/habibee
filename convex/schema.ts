import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  users: defineTable({
    email: v.string(),
    image: v.optional(v.string()),
    fullname: v.string(),
    username: v.optional(v.string()),
    profile_pic: v.optional(v.string()),
    streak: v.optional(v.number()),
    last_streak_date: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    pushTokens: v.optional(v.array(v.string())),
  }).index("email", ["email"]),

  weekly_stats: defineTable({
    user: v.id("users"),
    week_day: v.string(),
    date: v.string(),
  }).index("by_user_weekday", ["user", "week_day"]),

  motivational_messages: defineTable({
    text: v.string(),
    visible: v.boolean(),
  }).index("by_visible", ["visible"]),

  habits: defineTable({
    icon: v.optional(v.string()),
    theme: v.optional(v.string()),
    habit: v.string(),
    duration: v.optional(v.number()),
    goal: v.number(),
    strict: v.boolean(),
    user: v.id("users"),
    current_streak: v.number(),
    highest_streak: v.number(),
    lastCompleted: v.optional(v.string()),
    timer_start_time: v.optional(v.number()), // Timestamp when timer started
    timer_elapsed: v.optional(v.number()), // Accumulated elapsed time in seconds
    last_daily_reset_date: v.optional(v.string()), // Date when sub-habits were last reset
  })
    .index("by_user", ["user"])
    .index("by_user_habit", ["user", "habit"]),

  habit_enteries: defineTable({
    user: v.id("users"),
    habit: v.id("habits"),
    status: v.union(v.literal("completed"), v.literal("missed")),
    date: v.string(),
  })
    .index("by_habit_date", ["habit", "date"])
    .index("by_user_date", ["user", "date"]),

  feedback: defineTable({
    user: v.id("users"),
    message: v.string(),
    createdAt: v.string(),
  }).index("by_user", ["user"]),

  sub_habits: defineTable({
    name: v.string(),
    parent_habit: v.id("habits"),
    completed: v.boolean(),
  }).index("by_parent_habit", ["parent_habit"]),
});

export default schema;
