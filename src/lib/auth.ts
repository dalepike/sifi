import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getUserWithPasswordHash, verifyPassword, getUserById } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.error("[auth] authorize called with email:", credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            console.error("[auth] missing credentials");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          const user = await getUserWithPasswordHash(email);
          console.error("[auth] user lookup result:", !!user);
          if (!user) {
            console.error("[auth] USER NOT FOUND");
            return null;
          }

          const isValid = verifyPassword(password, user.passwordHash);
          console.error("[auth] password check:", isValid);
          if (!isValid) {
            console.error("[auth] PASSWORD MISMATCH");
            return null;
          }

          console.error("[auth] SUCCESS");
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("[auth] EXCEPTION:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        const user = await getUserById(token.sub);
        if (user) {
          session.user.name = user.name;
          session.user.email = user.email;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  debug: true,
});
