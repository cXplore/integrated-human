import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Dev-only test user credentials
const DEV_TEST_EMAIL = "testuser@integrated-human.dev";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Development-only credentials provider for testing
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              // Only allow the test user email in development
              if (credentials?.email === DEV_TEST_EMAIL) {
                const user = await prisma.user.findUnique({
                  where: { email: DEV_TEST_EMAIL },
                });
                if (user) {
                  return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                  };
                }
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Create or update user in database
      const dbUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          image: user.image,
        },
        create: {
          email: user.email,
          name: user.name,
          image: user.image,
        },
      });

      // Store account info if it's a new provider link
      if (account) {
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Get the database user ID
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
});
