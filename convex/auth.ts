import { convexAuth, retrieveAccount, createAccount } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
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
    ConvexCredentials({
      id: "apple",
      authorize: async (credentials, ctx) => {
        const identityToken = credentials.token as string || credentials.identityToken as string;
        if (!identityToken) {
          throw new Error("Missing Apple identityToken parameter");
        }

        // 1. Decode Apple identityToken (JWT) without verification for flexibility/speed
        const parts = identityToken.split(".");
        if (parts.length !== 3) {
          throw new Error("Invalid JWT token format");
        }
        // Base64URL decode the payload
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
          base64 += "=";
        }
        const payloadJson = Buffer.from(base64, "base64").toString("utf-8");
        const appleProfile = JSON.parse(payloadJson);

        // Verify standard claims
        if (appleProfile.iss !== "https://appleid.apple.com") {
          throw new Error("Invalid token issuer");
        }

        const email = appleProfile.email as string | undefined;
        if (!email) {
          throw new Error("Email not found in Apple identity token");
        }

        // Apple only returns user name once on initial sign-in, which the frontend passes to us
        const firstName = credentials.firstName as string || "";
        const lastName = credentials.lastName as string || "";
        const fullname = (firstName || lastName)
          ? `${firstName} ${lastName}`.trim()
          : (email ? email.split("@")[0] : "Apple User");

        // Try to retrieve existing account
        const retrieved = await retrieveAccount(ctx, {
          provider: "apple",
          account: { id: appleProfile.sub },
        });

        if (retrieved !== null) {
          return { userId: retrieved.user._id };
        }

        // Otherwise create new account
        const created = await createAccount(ctx, {
          provider: "apple",
          account: { id: appleProfile.sub },
          profile: {
            email,
            fullname,
            username: firstName || email.split("@")[0],
          },
        });

        return { userId: created.user._id };
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
