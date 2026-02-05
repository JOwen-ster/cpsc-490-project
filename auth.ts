import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      // Ask for any extra scopes you need here
      // Default: "read:user user:email"
      authorization: {
        params: {
          scope: "read:user user:email repo", // example: access repos and issues
        },
      },
    }),
  ],

  callbacks: {
    // Attach extra fields to the token
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token; // GitHub access token
      }
      if (profile) {
        token.id = profile.id;
        token.username = profile.login;
        token.avatar = profile.avatar_url;
      }
      return token;
    },

    // Attach token fields to the session object
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.image = token.avatar as string;
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
