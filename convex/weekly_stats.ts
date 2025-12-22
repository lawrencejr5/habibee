import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get_user_weekly_stats = query({
  args: {},
  handler: async (ctx, args) => {
    const user_id = await getAuthUserId(ctx);
    if (!user_id) throw new Error("Unauthenticated");

    const weekly_stats = await ctx.db
      .query("weekly_stats")
      .withIndex("by_user_weekday", (q) => q.eq("user", user_id))
      .collect();

    return weekly_stats;
  },
});
