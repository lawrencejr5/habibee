import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  callbacks: {
    // Explicitly typing ctx as MutationCtx connects it to your generated schema
    async createOrUpdateUser(ctx: MutationCtx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const email = args.profile.email as string;

      // Now withIndex("by_email") will be recognized by TypeScript
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      if (existingUser) {
        throw new ConvexError("Email already exists");
      }

      return await ctx.db.insert("users", {
        email: email,
        fullname: args.profile.fullname as string,
        username: args.profile.username as string,
        profile_pic: args.profile.profile_pic as string,
      });
    },
  },
  providers: [
    Password({
      profile(params) {
        if (!params.email) {
          throw new ConvexError("Email is required");
        }
        return {
          email: params.email as string,
          fullname: params.fullname as string,
          username: params.username as string,
          profile_pic: params.profile_pic as string,
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 6) {
          throw new ConvexError("Password too short");
        }
      },
    }),
  ],

});