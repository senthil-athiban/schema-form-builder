import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@form-builder/db";
import { createPersonalWorkspace } from "./workspace";

const isProduction = process.env.NODE_ENV === "production";


export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
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
