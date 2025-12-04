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
  }).index("for_email", ["email"]),

  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),

  motivational_messages: defineTable({
    text: v.string(),
    visible: v.boolean(),
  }),
});

export default schema;
