import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ConvexError } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { ResendOTPPasswordReset } from "./password_reset";

async function findUserByEmail(ctx: MutationCtx, email: string | undefined) {
  if (!email) return null;
  return await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: ResendOTPPasswordReset,
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
    Google({
      profile(googleProfile) {
        return {
          id: googleProfile.sub,
          email: googleProfile.email,
          fullname: googleProfile.name,
          image: googleProfile.image,
          username: googleProfile.name.split(" ")[0],
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ redirectTo }) {
      // 1. Check if it's a local development URL
      const isLocal = redirectTo.startsWith("http://localhost");

      // 2. Check if it's your specific mobile app scheme
      const isApp = redirectTo.startsWith("com.lawrencejr.habibee://");

      if (isLocal || isApp) {
        return redirectTo;
      }

      // 3. Block everything else
      throw new Error(`Security Block: Invalid redirect to ${redirectTo}`);
    },

    async createOrUpdateUser(ctx, args) {
      // If Convex Auth already found a linked user, just reuse it
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const email = (args.profile as any).email as string | undefined;

      // Custom linking: if a user with this email already exists, reuse it
      const existingUser = await findUserByEmail(ctx, email);
      if (existingUser) {
        return existingUser._id;
      }

      // Otherwise create a new user document with whatever fields you want
      return await ctx.db.insert("users", {
        email,
        fullname: (args.profile as any).fullname ?? (args.profile as any).name,
        username: (args.profile as any).username ?? null,
        profile_pic:
          (args.profile as any).profile_pic ?? (args.profile as any).image,
      });
    },
  },
});
