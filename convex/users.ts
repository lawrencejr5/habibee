import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { getAuthUserId } from "@convex-dev/auth/server";

export const update_username = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user_id = await getAuthUserId(ctx);
    if (user_id === null) throw new Error("User not authenticated");

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
    return user;
  },
});
