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
        console.log("[auth] authorize called");
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] missing credentials");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        console.log("[auth] looking up user:", email);

        const user = await getUserWithPasswordHash(email);
        console.log("[auth] user found:", !!user);
        if (!user) {
          return null;
        }

        console.log("[auth] verifying password, hash length:", user.passwordHash?.length);
        const isValid = verifyPassword(password, user.passwordHash);
        console.log("[auth] password valid:", isValid);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
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
});
