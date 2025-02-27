import NextAuth from "next-auth"
import Github from "next-auth/providers/github" 

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Github({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        authorization: {
          url: "https://github.com/login/oauth/authorize",
          params: {
            scope: "repo",
            prompt: "consent"
          },
        },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
        if (account) {
          token.accessToken = account.access_token;
          token.id = account.providerAccountId;
        }
        return token;
    },
    async session({ session, token }) {
        // @ts-expect-error we add to the session
        session.accessToken = token.accessToken;
        // @ts-expect-error we add to the session
        session.user.id = token.id;
        return session;
    },
  },
})