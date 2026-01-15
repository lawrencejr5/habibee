import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const send_feedback = mutation({
    args: { message: v.string() },
    handler: async (ctx, { message }) => {
        const userId = await getAuthUserId(ctx);
        if (userId === null) throw new Error("Not authenticated");

        await ctx.db.insert("feedback", {
            user: userId,
            message,
            createdAt: new Date().toISOString(),
        });
    },
});
