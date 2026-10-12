import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@form-builder/db";
import { createPersonalWorkspace } from "./workspace";
import { sendEmail, verificationEmail } from "./email.js";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8, // web sign-up form checks the same (MIN_PASSWORD_LENGTH)
    // No session until the email is confirmed; sign-in returns 403 meanwhile
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    // An unverified user who tries to sign in gets a fresh link
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1 hour, matching the email text
    sendVerificationEmail: async ({ user, url }) => {
      // Not awaited: response time shouldn't reveal whether an email was sent
      void sendEmail({ to: user.email, ...verificationEmail(user.name, url) });
    },
  },
  trustedOrigins: [process.env.WEB_ORIGIN ?? "http://localhost:5173"],
  advanced: {
    database: { generateId: false },
    cookiePrefix: "form-builder",
    useSecureCookies: isProduction
  },
  databaseHooks: {
    user: {
      create: {
        // Every new account gets its own workspace
        after: async (user) => {
          await createPersonalWorkspace(user);
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // extend it when used and older than a day
  },
});
