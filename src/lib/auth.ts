import { timingSafeEqual as bufferTimingSafeEqual } from "crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { rateLimit } from "@/lib/rate-limit";

const LOGIN_ATTEMPT_LIMIT = 8;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // crypto.timingSafeEqual requires equal-length buffers; still perform a
    // comparison of matching cost so a length mismatch doesn't return faster.
    bufferTimingSafeEqual(bufA, bufA);
    return false;
  }
  return bufferTimingSafeEqual(bufA, bufB);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const normalizedEmail = email.trim().toLowerCase();
        const { allowed } = rateLimit(
          `login:${normalizedEmail}`,
          LOGIN_ATTEMPT_LIMIT,
          LOGIN_ATTEMPT_WINDOW_MS
        );
        if (!allowed) return null;

        let user = await prisma.user.findUnique({ where: { email } });

        // Bootstrap: first successful login with the configured admin
        // credentials creates the owner account in the database.
        if (
          !user &&
          email === process.env.ADMIN_EMAIL &&
          process.env.ADMIN_PASSWORD &&
          timingSafeEqual(password, process.env.ADMIN_PASSWORD)
        ) {
          user = await prisma.user.create({
            data: { email, passwordHash: await bcrypt.hash(password, 10), role: "ADMIN" },
          });
          return { id: user.id, email: user.email, role: user.role };
        }

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
});
