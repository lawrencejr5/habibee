import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getDaysDifference } from "./utils";

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
      .withIndex("by_hive_user", (q) =>
        q.eq("hive", hive._id).eq("user", userId),
      )
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
      .withIndex("by_hive_user", (q) =>
        q.eq("hive", args.hiveId).eq("user", userId),
      )
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

export const rename_hive = mutation({
  args: { hiveId: v.id("hives"), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const hive = await ctx.db.get(args.hiveId);
    if (!hive) throw new Error("Hive not found");
    if (hive.creator !== userId)
      throw new Error("Only the leader can rename the hive");

    if (!args.name.trim()) throw new Error("Hive name is required");

    await ctx.db.patch(args.hiveId, { name: args.name.trim() });
  },
});

export const delete_hive = mutation({
  args: { hiveId: v.id("hives") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("User not authenticated");

    const hive = await ctx.db.get(args.hiveId);
    if (!hive) throw new Error("Hive not found");
    if (hive.creator !== userId)
      throw new Error("Only the leader can delete the hive");

    // Delete all members
    const members = await ctx.db
      .query("hive_members")
      .withIndex("by_hive", (q) => q.eq("hive", args.hiveId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete the hive
    await ctx.db.delete(args.hiveId);
  },
});

export async function evaluateHiveStreak(ctx: any, hiveId: any, today: string) {
  const hive = await ctx.db.get(hiveId);
  if (!hive) return;

  const memberships = await ctx.db
    .query("hive_members")
    .withIndex("by_hive", (q: any) => q.eq("hive", hiveId))
    .collect();

  const totalMembers = memberships.length;
  if (totalMembers <= 1) return;

  let usersWithStreakToday = 0;
  for (const m of memberships) {
    const user = await ctx.db.get(m.user);
    if (user && user.last_streak_date === today) {
      usersWithStreakToday++;
    }
  }

  let meetsCondition = false;
  if (totalMembers === 2) {
    meetsCondition = usersWithStreakToday === 2;
  } else {
    meetsCondition = usersWithStreakToday >= Math.ceil(totalMembers / 2);
  }

  let newStreak = hive.streak ?? 0;

  if (hive.last_streak_date && hive.last_streak_date !== today) {
    if (getDaysDifference(hive.last_streak_date, today) > 1) {
      newStreak = 0;
    }
  }

  if (meetsCondition) {
    if (hive.last_streak_date !== today) {
      newStreak += 1;
      await ctx.db.patch(hiveId, {
        streak: newStreak,
        last_streak_date: today,
      });
    }
  } else {
    if (newStreak === 0 && hive.streak !== 0) {
      await ctx.db.patch(hiveId, { streak: 0 });
    }
  }
}

export const manual_trigger_hive_eval = internalMutation({
  args: { hiveId: v.id("hives"), today: v.string() },
  handler: async (ctx, args) => {
    await evaluateHiveStreak(ctx, args.hiveId, args.today);
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
          isLeader: hive.creator === userId,
        };
      }),
    );

    return hives.filter(Boolean);
  },
});

export const get_hive_members = query({
  args: { hiveId: v.id("hives"), today: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const hive = await ctx.db.get(args.hiveId);
    if (!hive) return [];

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
          isLeader: hive.creator === user._id,
        };
      }),
    );

    return members.filter(Boolean);
  },
});
