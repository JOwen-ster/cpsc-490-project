import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
    ],

    callbacks: {
        async jwt({ token, user, profile }) {
            if (user && profile) {
                token.id = profile.id;
                token.username = profile.login; // username
            }
            return token;
        },
    },
});
