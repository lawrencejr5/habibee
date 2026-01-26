import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internalQuery } from "./_generated/server";

import { getAuthUserId } from "@convex-dev/auth/server";

export const update_username = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user_id = await getAuthUserId(ctx);
    if (user_id === null) throw new Error("User not authenticated");

    ctx.db.query;
    await ctx.db.patch(user_id, {
      username,
    });
  },
});

export const get_current_user = query({
  args: {},
  handler: async (ctx) => {
    const user_id = await getAuthUserId(ctx);
    if (user_id === null) return null;

    const user = await ctx.db.get(user_id);
    if (!user) return null;

    let profile_url = null;
    if (user.profile_pic) {
      profile_url = await ctx.storage.getUrl(user.profile_pic);
    }

    return { ...user, profile_url };
  },
});

export const update_user_details = mutation({
  args: { fullname: v.string(), username: v.optional(v.string()) },
  handler: async (ctx, { fullname, username }) => {
    const user_id = await getAuthUserId(ctx);
    if (user_id === null) throw new Error("User not authenticated");

    const patch: any = { fullname };
    if (username !== undefined) patch.username = username;

    await ctx.db.patch(user_id, patch);
  },
});

export const report_image_upload_url = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const update_profile_image = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthorized");

    const user = await ctx.db.get(user_id);
    if (user?.profile_pic) {
      await ctx.storage.delete(user.profile_pic);
    }

    await ctx.db.patch(user_id, {
      profile_pic: args.storageId,
    });
  },
});

export const delete_account = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("User not authenticated");

    // 1. Delete habit entries
    const habitEntries = await ctx.db
      .query("habit_enteries")
      .withIndex("by_user_date", (q) => q.eq("user", userId))
      .collect();
    for (const entry of habitEntries) {
      await ctx.db.delete(entry._id);
    }

    // 2. Delete habits
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .collect();
    for (const habit of habits) {
      await ctx.db.delete(habit._id);
    }

    // 3. Delete weekly stats
    const weeklyStats = await ctx.db
      .query("weekly_stats")
      .withIndex("by_user_weekday", (q) => q.eq("user", userId))
      .collect();
    for (const stat of weeklyStats) {
      await ctx.db.delete(stat._id);
    }

    // 4. Delete auth accounts and sessions
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }

    // 5. Delete profile picture from storage if exists
    const user = await ctx.db.get(userId);
    if (user?.profile_pic) {
      await ctx.storage.delete(user.profile_pic as any);
    }

    // 6. Delete the user
    await ctx.db.delete(userId);
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const storePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) return;

    const user = await ctx.db.get(user_id);
    if (!user) return;

    const currentTokens = user.pushTokens || [];
    if (!currentTokens.includes(args.token)) {
      await ctx.db.patch(user_id, {
        pushTokens: [...currentTokens, args.token],
      });
    }
  },
});

export const removePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) return;

    const user = await ctx.db.get(user_id);
    if (!user || !user.pushTokens) return;

    const newTokens = user.pushTokens.filter((t) => t !== args.token);
    await ctx.db.patch(user_id, {
      pushTokens: newTokens,
    });
  },
});
