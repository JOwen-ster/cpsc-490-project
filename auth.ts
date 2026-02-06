import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      // Ask for any extra scopes you need here
      // Default: "read:user user:email"
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token as string;
      }
      if (profile) {
        token.id = profile.id?.toString() as string;
        token.username = profile.login as string;
        token.avatar = profile.avatar_url as string;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.image = token.avatar as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});
