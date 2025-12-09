import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  users: defineTable({
    fullname: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    profile_pic: v.optional(v.string()),
    streak: v.optional(v.number()),
    last_streak_date: v.optional(v.string()),
  }).index("by_email", ["email"]),

  weekly_stats: defineTable({
    user: v.id("users"),
    week_day: v.string(),
    date: v.string(),
  }).index("by_user", ["user"]),

  motivational_messages: defineTable({
    text: v.string(),
    visible: v.boolean(),
  }).index("by_visible", ["visible"]),

  habits: defineTable({
    icon: v.optional(v.string()),
    theme: v.optional(v.string()),
    habit: v.string(),
    duration: v.number(),
    goal: v.number(),
    strict: v.boolean(),
    user: v.id("users"),
    current_streak: v.number(),
    highest_streak: v.number(),
    lastCompleted: v.optional(v.string()),
  }).index("by_user", ["user"]),

  habit_enteries: defineTable({
    user: v.id("users"),
    habit: v.id("habits"),
    status: v.union(v.literal("completed"), v.literal("missed")),
    date: v.string(),
  })
    .index("by_habit_date", ["habit", "date"])
    .index("by_user_date", ["user", "date"]),
});

export default schema;
