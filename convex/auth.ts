import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          fullname: params.fullname as string,
          username: params.username as string,
          profile_pic: params.profile_pic as string,
        };
      },
    }),
  ],
});
