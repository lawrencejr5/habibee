import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({

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
    Google,
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
  },
});