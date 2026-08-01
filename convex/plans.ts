import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get_plans = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthenticated");

    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("user", user))
      .collect();

    return plans;
  },
});

export const add_plan = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthenticated");

    const plan_id = await ctx.db.insert("plans", {
      user,
      title: args.title,
      date: args.date,
      time: args.time,
      completed: false,
    });

    return plan_id;
  },
});

export const toggle_plan = mutation({
  args: {
    plan_id: v.id("plans"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthenticated");

    const plan = await ctx.db.get(args.plan_id);
    if (!plan) throw new Error("Plan not found");
    if (plan.user !== user) throw new Error("Unauthorized");

    await ctx.db.patch(args.plan_id, {
      completed: !plan.completed,
    });

    return { completed: !plan.completed };
  },
});

export const update_plan = mutation({
  args: {
    plan_id: v.id("plans"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthenticated");

    const plan = await ctx.db.get(args.plan_id);
    if (!plan) throw new Error("Plan not found");
    if (plan.user !== user) throw new Error("Unauthorized");

    const fields: Record<string, any> = {};
    if (args.title !== undefined) fields.title = args.title;
    if (args.date !== undefined) fields.date = args.date;
    if (args.time !== undefined) {
      fields.time = args.time === null ? undefined : args.time;
    }

    await ctx.db.patch(args.plan_id, fields);
    return { msg: "success" };
  },
});

export const delete_plan = mutation({
  args: {
    plan_id: v.id("plans"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthenticated");

    const plan = await ctx.db.get(args.plan_id);
    if (!plan) throw new Error("Plan not found");
    if (plan.user !== user) throw new Error("Unauthorized");

    await ctx.db.delete(args.plan_id);
    return { msg: "Plan deleted" };
  },
});
