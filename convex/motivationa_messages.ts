import { query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("motivational_messages")
      .withIndex("by_visible", (q) => q.eq("visible", true))
      .collect();
  },
});
