import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
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
  ],

});