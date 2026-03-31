import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------- helpers ----------

function generateHiveCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---------- mutations ----------

export const create_hive = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    if (!args.name.trim()) throw new Error("Hive name is required");

    // Generate a unique code (retry if collision)
    let code = generateHiveCode();
    let existing = await ctx.db
      .query("hives")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    while (existing) {
      code = generateHiveCode();
      existing = await ctx.db
        .query("hives")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    }

    const hiveId = await ctx.db.insert("hives", {
      name: args.name.trim(),
      code,
      creator: userId,
    });

    // Auto-add creator as member
    await ctx.db.insert("hive_members", {
      hive: hiveId,
      user: userId,
      joined_at: new Date().toISOString().split("T")[0],
    });

    return { hiveId, code };
  },
});

export const join_hive = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const code = args.code.trim().toUpperCase();

    const hive = await ctx.db
      .query("hives")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (!hive) throw new Error("Invalid hive code");

    // Check if already a member
    const existing = await ctx.db
      .query("hive_members")
      .withIndex("by_hive_user", (q) => q.eq("hive", hive._id).eq("user", userId))
      .unique();

    if (existing) throw new Error("You're already in this hive");

    await ctx.db.insert("hive_members", {
      hive: hive._id,
      user: userId,
      joined_at: new Date().toISOString().split("T")[0],
    });

    return { hiveId: hive._id, name: hive.name };
  },
});

export const leave_hive = mutation({
  args: { hiveId: v.id("hives") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const membership = await ctx.db
      .query("hive_members")
      .withIndex("by_hive_user", (q) => q.eq("hive", args.hiveId).eq("user", userId))
      .unique();

    if (!membership) throw new Error("You're not in this hive");

    await ctx.db.delete(membership._id);

    // If no more members, delete the hive
    const remaining = await ctx.db
      .query("hive_members")
      .withIndex("by_hive", (q) => q.eq("hive", args.hiveId))
      .collect();

    if (remaining.length === 0) {
      await ctx.db.delete(args.hiveId);
    }
  },
});

// ---------- queries ----------

export const get_my_hives = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("hive_members")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .collect();

    const hives = await Promise.all(
      memberships.map(async (m) => {
        const hive = await ctx.db.get(m.hive);
        if (!hive) return null;

        const members = await ctx.db
          .query("hive_members")
          .withIndex("by_hive", (q) => q.eq("hive", hive._id))
          .collect();

        return {
          ...hive,
          memberCount: members.length,
        };
      })
    );

    return hives.filter(Boolean);
  },
});

export const get_hive_members = query({
  args: { hiveId: v.id("hives"), today: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("hive_members")
      .withIndex("by_hive", (q) => q.eq("hive", args.hiveId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.user);
        if (!user) return null;

        let profile_url = null;
        if (user.profile_pic) {
          profile_url = await ctx.storage.getUrl(user.profile_pic);
        }

        return {
          _id: user._id,
          fullname: user.fullname,
          username: user.username,
          profile_url,
          streak: user.streak ?? 0,
          completedToday: user.last_streak_date === args.today,
        };
      })
    );

    return members.filter(Boolean);
  },
});
