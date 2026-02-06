import NextAuth from "next-auth";
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
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.id = profile.id?.toString();
        token.username = profile.login as string;
        token.avatar = profile.avatar_url as string;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.image = token.avatar;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
});
